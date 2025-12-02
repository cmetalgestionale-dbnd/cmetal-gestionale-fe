'use client';

import { useWS } from '@/app/(DashboardLayout)/ws/WSContext';
import { IMessage } from '@stomp/stompjs';

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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

interface Utente {
  id: number;
  username: string;
  password?: string;
  livello: number;
  nome?: string;
  cognome?: string;
  email?: string;
  telefono?: string;
  attivo: boolean;
  isDeleted?: boolean;
}

const ruoloLabel = (livello: number) => {
  switch (livello) {
    case 0:
      return <Chip label="Amministratore" color="primary" size="small" />;
    case 1:
      return <Chip label="Supervisore" color="info" size="small" />;
    case 2:
      return <Chip label="Dipendente" color="secondary" size="small" />;
    default:
      return <Chip label={`Ruolo ${livello}`} size="small" />;
  }
};

const UserManagement = ({ readOnly = false }: { readOnly?: boolean }) => {
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [deletedUtenti, setDeletedUtenti] = useState<Utente[]>([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Utente | null>(null);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Utente | null>(null);

  const [actionLoading, setActionLoading] = useState(false); // 🔥 nuovo

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    livello: 2,
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    attivo: true,
  });

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchUtenti = async () => {
    const res = await fetch(`${backendUrl}/api/utenti`, { credentials: 'include' });
    const data: Utente[] = await res.json();

    const active = data.filter(u => !u.isDeleted && u.username !== 'superadmin');
    setUtenti(active);

    const deleted = data.filter(u => u.isDeleted);
    setDeletedUtenti(deleted);
  };

  useEffect(() => {
    fetchUtenti();
  }, []);

  const { subscribe } = useWS();

  useEffect(() => {
    const unsubscribe = subscribe((msg: IMessage) => {
      try {
        const payload = msg.body ? JSON.parse(msg.body) : {};
        const tipo = payload.tipoEvento ?? payload.tipo ?? payload.tipo_evento;
        if (tipo === 'REFRESH' || tipo === 'MSG_REFRESH') {
          fetchUtenti();
        }
      } catch (e) {
        console.warn('Errore parsing messaggio WS', e);
      }
    });

    return () => unsubscribe();
  }, [subscribe]);

  const handleOpenForm = (utente?: Utente) => {
    if (utente) {
      setEditingUser(utente);
      setFormData({
        username: utente.username,
        password: '',
        livello: utente.livello,
        nome: utente.nome || '',
        cognome: utente.cognome || '',
        email: utente.email || '',
        telefono: utente.telefono || '',
        attivo: utente.attivo,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        livello: 2,
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        attivo: true,
      });
    }
    setOpen(true);
  };

  const handleCloseForm = () => {
    setOpen(false);
    setEditingUser(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser
      ? `${backendUrl}/api/utenti/${editingUser.id}`
      : `${backendUrl}/api/utenti`;

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...formData, livello: parseInt(`${formData.livello}`, 10) }),
    });

    setActionLoading(false);

    handleCloseForm();
    fetchUtenti();
  };

  const handleDeleteClick = (utente: Utente) => {
    setUserToDelete(utente);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setActionLoading(true);

    await fetch(`${backendUrl}/api/utenti/${userToDelete.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    setActionLoading(false);

    setConfirmDeleteOpen(false);
    setUserToDelete(null);
    fetchUtenti();
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setUserToDelete(null);
  };

  const handleRestore = async (utente: Utente) => {
    setActionLoading(true);

    const payload = {
      username: utente.username,
      password: '',
      livello: utente.livello,
      nome: utente.nome || '',
      cognome: utente.cognome || '',
      email: utente.email || '',
      telefono: utente.telefono || '',
      attivo: true,
      isDeleted: false,
    };

    await fetch(`${backendUrl}/api/utenti/${utente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    setActionLoading(false);

    fetchUtenti();
    setDeletedOpen(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" mb={3} fontWeight={600}>
        Utenze
      </Typography>

      {!readOnly && (
        <>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleOpenForm()}
            sx={{ mb: 2 }}
            disabled={actionLoading}
          >
            Aggiungi Utente
          </Button>

          <Button
            variant="outlined"
            size="small"
            sx={{ ml: 2, mb: 2 }}
            onClick={() => setDeletedOpen(true)}
            disabled={actionLoading}
          >
            Utenze cancellate
          </Button>
        </>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Cognome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefono</TableCell>
              <TableCell>Ruolo</TableCell>
              <TableCell>Attivo</TableCell>
              {!readOnly && <TableCell>Azioni</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {utenti.map((utente) => (
              <TableRow key={utente.id}>
                <TableCell>{utente.username}</TableCell>
                <TableCell>{utente.nome}</TableCell>
                <TableCell>{utente.cognome}</TableCell>
                <TableCell>{utente.email}</TableCell>
                <TableCell>{utente.telefono}</TableCell>
                <TableCell>{ruoloLabel(utente.livello)}</TableCell>
                <TableCell>
                  <Switch checked={utente.attivo} disabled />
                </TableCell>

                {!readOnly && (
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenForm(utente)}
                      disabled={actionLoading}
                    >
                      <Edit fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(utente)}
                      disabled={actionLoading}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>

      {/* FORM UTENTE */}
      <Dialog open={open} onClose={handleCloseForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingUser ? 'Modifica Utente' : 'Nuovo Utente'}</DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            size="small"
            fullWidth
            disabled={actionLoading}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            size="small"
            helperText={editingUser ? 'Lascia vuoto per non cambiare la password' : ''}
            fullWidth
            disabled={actionLoading}
          />
          <TextField
            label="Nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            size="small"
            fullWidth
            disabled={actionLoading}
          />
          <TextField
            label="Cognome"
            name="cognome"
            value={formData.cognome}
            onChange={handleChange}
            size="small"
            fullWidth
            disabled={actionLoading}
          />
          <TextField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            size="small"
            fullWidth
            disabled={actionLoading}
          />
          <TextField
            label="Telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            size="small"
            fullWidth
            disabled={actionLoading}
          />

          <Typography variant="subtitle2">Ruolo</Typography>

          <RadioGroup
            row
            name="livello"
            value={formData.livello}
            onChange={(e) =>
              setFormData({ ...formData, livello: parseInt(e.target.value, 10) })
            }
          >
            <FormControlLabel value={0} control={<Radio size="small" />} label="Amministratore" disabled={actionLoading} />
            <FormControlLabel value={1} control={<Radio size="small" />} label="Supervisore" disabled={actionLoading} />
            <FormControlLabel value={2} control={<Radio size="small" />} label="Dipendente" disabled={actionLoading} />
          </RadioGroup>

          <FormControlLabel
            control={
              <Switch
                checked={formData.attivo}
                onChange={handleChange}
                name="attivo"
                disabled={actionLoading}
              />
            }
            label="Attivo"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseForm} size="small" disabled={actionLoading}>Annulla</Button>
          <Button onClick={handleSubmit} size="small" variant="contained" disabled={actionLoading}>Salva</Button>
        </DialogActions>
      </Dialog>

      {/* Conferma eliminazione */}
      <Dialog open={confirmDeleteOpen} onClose={handleCancelDelete}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>

        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare <strong>{userToDelete?.username}</strong>?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancelDelete} size="small" disabled={actionLoading}>
            Annulla
          </Button>

          <Button
            onClick={handleConfirmDelete}
            size="small"
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* UTENTI CANCELLATI */}
      <Dialog open={deletedOpen} onClose={() => setDeletedOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Utenze Cancellate</DialogTitle>

        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Cognome</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {deletedUtenti.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.nome}</TableCell>
                  <TableCell>{u.cognome}</TableCell>

                  <TableCell>
                    <Button size="small" onClick={() => handleRestore(u)} disabled={actionLoading}>
                      Ripristina
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDeletedOpen(false)} disabled={actionLoading}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
};

export default UserManagement;
