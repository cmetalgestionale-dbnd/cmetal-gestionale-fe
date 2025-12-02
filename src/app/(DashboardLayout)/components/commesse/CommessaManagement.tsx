'use client';

import { useWS } from '@/app/(DashboardLayout)/ws/WSContext';
import { IMessage } from '@stomp/stompjs';

import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Button, TableContainer, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Delete, Edit, Search } from '@mui/icons-material';

interface Commessa {
  id: number;
  codice: string;
  descrizione?: string;
  pdfAllegato?: {
    nomeFile: string;
    storagePath: string;
  };
  isDeleted?: boolean;
  dataCreazione?: string;
}

const CommessaManagement = () => {
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [deletedCommesse, setDeletedCommesse] = useState<Commessa[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCommessa, setEditingCommessa] = useState<Commessa | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removeFileConfirm, setRemoveFileConfirm] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [commessaToDelete, setCommessaToDelete] = useState<Commessa | null>(null);
  const [deletedOpen, setDeletedOpen] = useState(false);

  const [formData, setFormData] = useState({
    codice: '',
    descrizione: '',
    dataCreazione: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const fetchCommesse = async () => {
  const existingRes = await fetch(`${backendUrl}/api/commesse/existing`, { credentials: 'include' });
  setCommesse(await existingRes.json());
};

const fetchDeletedCommesse = async () => {
  const deletedRes = await fetch(`${backendUrl}/api/commesse/deleted`, { credentials: 'include' });
  setDeletedCommesse(await deletedRes.json());
};



  useEffect(() => {
    fetchCommesse();
  }, []);

  const { subscribe } = useWS();

  useEffect(() => {
    const unsubscribe = subscribe((msg: IMessage) => {
      try {
        const payload = msg.body ? JSON.parse(msg.body) : {};
        const tipo = payload.tipoEvento ?? payload.tipo ?? payload.tipo_evento;
        if (tipo === 'REFRESH' || tipo === 'MSG_REFRESH') {
          fetchCommesse();
        }
      } catch (e) {
        console.warn('Errore parsing messaggio WS', e);
      }
    });

    return () => unsubscribe();
  }, [subscribe]);

  const handleOpenForm = (commessa?: Commessa) => {
    if (commessa) {
      setEditingCommessa(commessa);
      setFormData({
        codice: commessa.codice,
        descrizione: commessa.descrizione || '',
        dataCreazione: commessa.dataCreazione || ''
      });
    } else {
      setEditingCommessa(null);
      setFormData({ codice: '', descrizione: '', dataCreazione: '' });
    }
    setFile(null);
    setRemoveFileConfirm(false);
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditingCommessa(null);
    setFile(null);
    setRemoveFileConfirm(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];

      if (selectedFile.type !== 'application/pdf') {
        alert('Il file deve essere un PDF');
        e.target.value = '';
        return;
      }

      if (selectedFile.size > 2 * 1024 * 1024) {
        alert('Il file non può superare 2 MB');
        e.target.value = '';
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setRemoveFileConfirm(true);
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const form = new FormData();
      form.append('commessa', new Blob([JSON.stringify(formData)], { type: 'application/json' }));
      if (file) form.append('file', file);
      if (removeFileConfirm) form.append('removeFile', 'true');

      const url = editingCommessa
        ? `${backendUrl}/api/commesse/${editingCommessa.id}`
        : `${backendUrl}/api/commesse`;
      const method = editingCommessa ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: form, credentials: 'include' });

      if (!res.ok) {
        const text = await res.text();
        alert(`Errore: ${text}`);
        setActionLoading(false);
        return;
      }

      handleCloseForm();
      await fetchCommesse();
    } catch (err: any) {
      alert(`Errore: ${err.message}`);
    }
    setActionLoading(false);
  };

  const handleDeleteClick = (c: Commessa) => {
    setCommessaToDelete(c);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!commessaToDelete) return;

    setActionLoading(true);

    await fetch(`${backendUrl}/api/commesse/${commessaToDelete.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    setConfirmDeleteOpen(false);
    setCommessaToDelete(null);

    await fetchCommesse();

    setActionLoading(false);
  };

  const handleRestore = async (c: Commessa) => {
    setActionLoading(true);

    await fetch(`${backendUrl}/api/commesse/${c.id}/restore`, {
      method: 'PUT',
      credentials: 'include',
    });

    await fetchCommesse();

    setActionLoading(false);
  };

  const filteredCommesse = commesse.filter(c =>
    c.codice.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" mb={3} fontWeight={600}>Commesse</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button variant="contained" size="small" onClick={() => handleOpenForm()} disabled={actionLoading}>
          Aggiungi Commessa
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={async () => {
  await fetchDeletedCommesse();
  setDeletedOpen(true);
}}

          disabled={actionLoading}
        >
          Commesse cancellate
        </Button>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search fontSize="small" />
          <TextField
            label="Cerca per codice"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={actionLoading}
          />
        </Box>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Codice</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell>Allegato</TableCell>
              <TableCell>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCommesse.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.codice}</TableCell>
                <TableCell>{c.descrizione}</TableCell>
                <TableCell>
                  {c.pdfAllegato ? (
                    <a
                      href={`${backendUrl}/api/commesse/${c.id}/allegato`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      PDF
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenForm(c)} disabled={actionLoading}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(c)} disabled={actionLoading}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingCommessa ? 'Modifica Commessa' : 'Nuova Commessa'}</DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Codice" name="codice" value={formData.codice} onChange={handleChange} size="small" fullWidth disabled={actionLoading} />
          <TextField label="Descrizione" name="descrizione" value={formData.descrizione} onChange={handleChange} size="small" fullWidth disabled={actionLoading} />
          <input type="file" accept="application/pdf" onChange={handleFileChange} disabled={actionLoading} />

          {editingCommessa?.pdfAllegato && !removeFileConfirm && (
            <Box>
              Allegato attuale: {editingCommessa.pdfAllegato.nomeFile}{' '}
              <Button variant="outlined" size="small" color="error" onClick={handleRemoveFile} disabled={actionLoading}>
                Rimuovi
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseForm} size="small" disabled={actionLoading}>Annulla</Button>
          <Button onClick={handleSubmit} size="small" variant="contained" disabled={actionLoading}>Salva</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          Sei sicuro di voler eliminare <strong>{commessaToDelete?.codice}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} size="small" disabled={actionLoading}>Annulla</Button>
          <Button onClick={handleConfirmDelete} size="small" color="error" variant="contained" disabled={actionLoading}>Elimina</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deletedOpen} onClose={() => setDeletedOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Commesse Cancellate</DialogTitle>

        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Codice</TableCell>
                <TableCell>Descrizione</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {deletedCommesse.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.codice}</TableCell>
                  <TableCell>{c.descrizione}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleRestore(c)} disabled={actionLoading}>
                      Ripristina
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeletedOpen(false)} disabled={actionLoading}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CommessaManagement;
