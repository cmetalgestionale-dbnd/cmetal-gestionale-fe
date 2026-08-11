'use client';

import { useWS } from '@/app/(DashboardLayout)/ws/WSContext';
import { IMessage } from '@stomp/stompjs';

import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Button, TableContainer, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemButton,
  ListItemText, useMediaQuery, useTheme
} from '@mui/material';
import { Delete, Edit, PictureAsPdf, Search } from '@mui/icons-material';

interface Commessa {
  id: number;
  codice: string;
  descrizione?: string;
  allegati?: Allegato[];
  pdfAllegato?: {
    id?: number;
    nomeFile: string;
    storagePath: string;
  };
  isDeleted?: boolean;
  dataCreazione?: string;
}

interface Allegato {
  id: number;
  nomeFile: string;
  storagePath: string;
}

const CommessaManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [deletedCommesse, setDeletedCommesse] = useState<Commessa[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCommessa, setEditingCommessa] = useState<Commessa | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [removeFileConfirm, setRemoveFileConfirm] = useState(false);
  const [removeAllegatoIds, setRemoveAllegatoIds] = useState<number[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [commessaToDelete, setCommessaToDelete] = useState<Commessa | null>(null);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [allegatiCommessa, setAllegatiCommessa] = useState<Commessa | null>(null);

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
    setFiles([]);
    setRemoveFileConfirm(false);
    setRemoveAllegatoIds([]);
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditingCommessa(null);
    setFiles([]);
    setRemoveFileConfirm(false);
    setRemoveAllegatoIds([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      if (selectedFiles.some(selectedFile => selectedFile.type !== 'application/pdf')) {
        alert('Il file deve essere un PDF');
        e.target.value = '';
        return;
      }

      if (selectedFiles.some(selectedFile => selectedFile.size > 2 * 1024 * 1024)) {
        alert('Ogni file non può superare 2 MB; il backend proverà a comprimerlo entro 1 MB');
        e.target.value = '';
        return;
      }

      const currentCount = (editingCommessa?.allegati?.length || (editingCommessa?.pdfAllegato ? 1 : 0)) - removeAllegatoIds.length;
      if (currentCount + selectedFiles.length > 10) {
        alert('Puoi allegare al massimo 10 PDF per commessa');
        e.target.value = '';
        return;
      }

      setFiles(selectedFiles);
    }
  };

  const handleRemoveFile = () => {
    setRemoveFileConfirm(true);
  };

  const toggleRemoveAllegato = (id: number) => {
    setRemoveAllegatoIds((current) =>
      current.includes(id) ? current.filter(existingId => existingId !== id) : [...current, id]
    );
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      const form = new FormData();
      form.append('commessa', new Blob([JSON.stringify(formData)], { type: 'application/json' }));
      files.forEach(selectedFile => form.append('file', selectedFile));
      if (removeFileConfirm) form.append('removeFile', 'true');
      removeAllegatoIds.forEach(id => form.append('removeAllegatoIds', String(id)));

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

  const getAllegati = (c: Commessa | null) => {
    if (!c) return [];
    if (c.allegati && c.allegati.length > 0) {
      return c.allegati.map((allegato, index) => ({
        id: allegato.id,
        label: allegato.nomeFile || `PDF ${index + 1}`,
        href: `${backendUrl}/api/commesse/${c.id}/allegati/${allegato.id}`,
      }));
    }
    if (c.pdfAllegato) {
      return [{
        id: c.pdfAllegato.id || 0,
        label: c.pdfAllegato.nomeFile || 'PDF',
        href: `${backendUrl}/api/commesse/${c.id}/allegato`,
      }];
    }
    return [];
  };

  const renderAllegati = (c: Commessa) => {
    const allegati = getAllegati(c);
    if (allegati.length === 0) return <>-</>;

    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={<PictureAsPdf fontSize="small" />}
        onClick={() => setAllegatiCommessa(c)}
        disabled={actionLoading}
      >
        Allegati PDF ({allegati.length})
      </Button>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: { xs: 2, sm: 3 }, width: '100%', boxSizing: 'border-box' }}>
      <Typography variant={isMobile ? 'h6' : 'h5'} mb={2} fontWeight={600}>Commesse</Typography>

      <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
        <Button variant="contained" size="small" onClick={() => handleOpenForm()} disabled={actionLoading} fullWidth={isMobile}>
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
          fullWidth={isMobile}
        >
          Commesse cancellate
        </Button>

        <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search fontSize="small" />
          <TextField
            label="Cerca per codice"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={actionLoading}
            fullWidth={isMobile}
          />
        </Box>
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, width: '100%' }}>
          {filteredCommesse.map(c => (
            <Paper key={c.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
              <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{c.codice}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>{c.descrizione || '-'}</Typography>
              <Box sx={{ mt: 1 }}>{renderAllegati(c)}</Box>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1, justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={() => handleOpenForm(c)} disabled={actionLoading}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleDeleteClick(c)} disabled={actionLoading}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <TableContainer sx={{ display: 'block', overflowX: 'auto', overflowY: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, WebkitOverflowScrolling: 'touch' }}>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Codice</TableCell>
                <TableCell>Descrizione</TableCell>
                <TableCell>Allegati</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCommesse.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.codice}</TableCell>
                  <TableCell>{c.descrizione}</TableCell>
                  <TableCell>{renderAllegati(c)}</TableCell>
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
      )}

      <Dialog open={open} onClose={handleCloseForm} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{editingCommessa ? 'Modifica Commessa' : 'Nuova Commessa'}</DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, px: { xs: 2, sm: 3 } }}>
          <TextField label="Codice" name="codice" value={formData.codice} onChange={handleChange} size="small" fullWidth disabled={actionLoading} />
          <TextField label="Descrizione" name="descrizione" value={formData.descrizione} onChange={handleChange} size="small" fullWidth disabled={actionLoading} />
	          <input type="file" accept="application/pdf" multiple onChange={handleFileChange} disabled={actionLoading} />
	          {files.length > 0 && (
	            <Typography variant="body2">
	              Nuovi file selezionati: {files.map(selectedFile => selectedFile.name).join(', ')}
	            </Typography>
	          )}

	          {editingCommessa?.allegati && editingCommessa.allegati.length > 0 && (
	            <Box>
	              <Typography variant="subtitle2">Allegati attuali</Typography>
	              {editingCommessa.allegati.map((allegato, index) => (
                <Box key={allegato.id} sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, mt: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
	                  <a
	                    href={`${backendUrl}/api/commesse/${editingCommessa.id}/allegati/${allegato.id}`}
	                    target="_blank"
	                    rel="noopener noreferrer"
	                  >
	                    PDF {index + 1} - {allegato.nomeFile}
	                  </a>
	                  <Button
	                    variant="outlined"
	                    size="small"
	                    color={removeAllegatoIds.includes(allegato.id) ? 'warning' : 'error'}
	                    onClick={() => toggleRemoveAllegato(allegato.id)}
	                    disabled={actionLoading}
	                  >
	                    {removeAllegatoIds.includes(allegato.id) ? 'Annulla rimozione' : 'Rimuovi'}
	                  </Button>
	                </Box>
	              ))}
	            </Box>
	          )}

	          {editingCommessa?.pdfAllegato && (!editingCommessa.allegati || editingCommessa.allegati.length === 0) && !removeFileConfirm && (
	            <Box>
	              Allegato attuale: {editingCommessa.pdfAllegato.nomeFile}{' '}
              <Button variant="outlined" size="small" color="error" onClick={handleRemoveFile} disabled={actionLoading}>
                Rimuovi
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch' }}>
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

      <Dialog open={Boolean(allegatiCommessa)} onClose={() => setAllegatiCommessa(null)} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>Allegati PDF - {allegatiCommessa?.codice}</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <List disablePadding>
            {getAllegati(allegatiCommessa).map((allegato, index) => (
              <ListItem key={`${allegato.id}-${index}`} disablePadding divider>
                <ListItemButton component="a" href={allegato.href} target="_blank" rel="noopener noreferrer">
                  <ListItemText
                    primary={`PDF ${index + 1}`}
                    secondary={allegato.label}
                    primaryTypographyProps={{ fontWeight: 600 }}
                    secondaryTypographyProps={{ sx: { overflowWrap: 'anywhere' } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 } }}>
          <Button onClick={() => setAllegatiCommessa(null)} disabled={actionLoading}>Chiudi</Button>
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
