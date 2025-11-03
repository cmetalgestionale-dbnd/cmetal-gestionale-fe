'use client'

import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Button, TableContainer, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

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
  const [open, setOpen] = useState(false);
  const [editingCommessa, setEditingCommessa] = useState<Commessa | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [removeFileConfirm, setRemoveFileConfirm] = useState(false);

  const [formData, setFormData] = useState({
    codice: '',
    descrizione: '',
    dataCreazione: ''
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchCommesse = async () => {
    const res = await fetch(`${backendUrl}/api/commesse`, { credentials: 'include' });
    const data: Commessa[] = await res.json();
    setCommesse(data.filter(c => !c.isDeleted));
  };

  useEffect(() => {
    fetchCommesse();
  }, []);

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
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditingCommessa(null);
    setFile(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const form = new FormData();
    form.append('commessa', new Blob([JSON.stringify(formData)], { type: 'application/json' }));
    if (file) form.append('file', file);
    if (removeFileConfirm) form.append('removeFile', 'true');

    const url = editingCommessa
      ? `${backendUrl}/api/commesse/${editingCommessa.id}`
      : `${backendUrl}/api/commesse`;

    const method = editingCommessa ? 'PUT' : 'POST';

    await fetch(url, { method, body: form, credentials: 'include' });
    handleCloseForm();
    fetchCommesse();
  };

  const handleRemoveFile = () => {
    setRemoveFileConfirm(true);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" mb={3} fontWeight={600}>Commesse</Typography>
      <Button variant="contained" size="small" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>Aggiungi Commessa</Button>

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
            {commesse.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.codice}</TableCell>
                <TableCell>{c.descrizione}</TableCell>
                <TableCell>
                  {c.pdfAllegato ? <a href={`${backendUrl}/api/commesse/${c.id}/allegato/url`} target="_blank">PDF</a> : '-'}
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenForm(c)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small">{/* eventualmente Delete */}<Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Commessa */}
      <Dialog open={open} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingCommessa ? 'Modifica Commessa' : 'Nuova Commessa'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Codice" name="codice" value={formData.codice} onChange={handleChange} size="small" fullWidth />
          <TextField label="Descrizione" name="descrizione" value={formData.descrizione} onChange={handleChange} size="small" fullWidth />
          <TextField label="Data Creazione" name="dataCreazione" type="date" value={formData.dataCreazione} onChange={handleChange} size="small" fullWidth InputLabelProps={{ shrink: true }} />
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          {editingCommessa?.pdfAllegato && !removeFileConfirm && (
            <Box>
              Allegato attuale: {editingCommessa.pdfAllegato.nomeFile}{' '}
              <Button variant="outlined" size="small" color="error" onClick={handleRemoveFile}>Rimuovi</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} size="small">Annulla</Button>
          <Button onClick={handleSubmit} size="small" variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CommessaManagement;
