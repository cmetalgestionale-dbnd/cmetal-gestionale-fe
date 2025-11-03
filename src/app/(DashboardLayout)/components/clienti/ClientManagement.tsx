'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Button,
  TableContainer,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

interface Cliente {
  id: number;
  nome: string;
  riferimento?: string;
  telefono?: string;
  email?: string;
  indirizzo?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

const ClientManagement = ({ readOnly = false }: { readOnly?: boolean }) => {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [deletedClienti, setDeletedClienti] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    riferimento: '',
    telefono: '',
    email: '',
    indirizzo: '',
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchClienti = async () => {
    const res = await fetch(`${backendUrl}/api/clienti`, { credentials: 'include' });
    const data: Cliente[] = await res.json();

    const active = data.filter(c => !c.isDeleted);
    setClienti(active);

    const deleted = data.filter(c => c.isDeleted);
    setDeletedClienti(deleted);
  };

  useEffect(() => {
    fetchClienti();
  }, []);

  const handleOpenForm = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nome: cliente.nome,
        riferimento: cliente.riferimento || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        indirizzo: cliente.indirizzo || '',
      });
    } else {
      setEditingCliente(null);
      setFormData({
        nome: '',
        riferimento: '',
        telefono: '',
        email: '',
        indirizzo: '',
      });
    }
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditingCliente(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    const method = editingCliente ? 'PUT' : 'POST';
    const url = editingCliente
      ? `${backendUrl}/api/clienti/${editingCliente.id}`
      : `${backendUrl}/api/clienti`;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData),
    });

    handleCloseForm();
    fetchClienti();
  };

  const handleDeleteClick = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clienteToDelete) return;
    await fetch(`${backendUrl}/api/clienti/${clienteToDelete.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setConfirmDeleteOpen(false);
    setClienteToDelete(null);
    fetchClienti();
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setClienteToDelete(null);
  };

  const handleRestore = async (cliente: Cliente) => {
    if (!cliente.id) return;

    const payload = {
      nome: cliente.nome,
      riferimento: cliente.riferimento || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      indirizzo: cliente.indirizzo || '',
      isDeleted: false,
    };

    await fetch(`${backendUrl}/api/clienti/${cliente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    fetchClienti();
    setDeletedOpen(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" mb={3} fontWeight={600}>
        Clienti
      </Typography>

      {!readOnly && (
        <>
          <Button variant="contained" size="small" onClick={() => handleOpenForm()} sx={{ mb: 2 }}>
            Aggiungi Cliente
          </Button>
          <Button variant="outlined" size="small" sx={{ ml: 2, mb: 2 }} onClick={() => setDeletedOpen(true)}>
            Clienti cancellati
          </Button>
        </>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Riferimento</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Telefono</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Indirizzo</TableCell>
              {!readOnly && <TableCell sx={{ fontWeight: 600 }}>Azioni</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {clienti.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.nome}</TableCell>
                <TableCell>{c.riferimento}</TableCell>
                <TableCell>{c.telefono}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.indirizzo}</TableCell>
                {!readOnly && (
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenForm(c)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(c)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form cliente */}
      <Dialog open={open} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Nome" name="nome" value={formData.nome} onChange={handleChange} size="small" fullWidth />
          <TextField label="Riferimento" name="riferimento" value={formData.riferimento} onChange={handleChange} size="small" fullWidth />
          <TextField label="Telefono" name="telefono" value={formData.telefono} onChange={handleChange} size="small" fullWidth />
          <TextField label="Email" name="email" value={formData.email} onChange={handleChange} size="small" fullWidth />
          <TextField label="Indirizzo" name="indirizzo" value={formData.indirizzo} onChange={handleChange} size="small" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} size="small">Annulla</Button>
          <Button onClick={handleSubmit} size="small" variant="contained">Salva</Button>
        </DialogActions>
      </Dialog>

      {/* Conferma eliminazione */}
      <Dialog open={confirmDeleteOpen} onClose={handleCancelDelete}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare <strong>{clienteToDelete?.nome}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} size="small">Annulla</Button>
          <Button onClick={handleConfirmDelete} size="small" color="error" variant="contained">Elimina</Button>
        </DialogActions>
      </Dialog>

      {/* Modale clienti cancellati */}
      <Dialog open={deletedOpen} onClose={() => setDeletedOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Clienti Cancellati</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Riferimento</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deletedClienti.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{c.nome}</TableCell>
                  <TableCell>{c.riferimento}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleRestore(c)}>Ripristina</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletedOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ClientManagement;
