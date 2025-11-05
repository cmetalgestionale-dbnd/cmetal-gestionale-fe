'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ArrowBack,
  ArrowForward,
  PictureAsPdf,
  PhotoCamera,
} from '@mui/icons-material';

interface Utente {
  id: number;
  nome: string;
  ruolo: 'ADMIN' | 'SUPERVISORE' | 'DIPENDENTE';
}

interface Commessa {
  id: number;
  codice: string;
  descrizione?: string;
  pdfAllegato?: { id: number; nomeFile: string; storagePath: string };
}

interface Cliente {
  id: number;
  nome: string;
}

interface Assegnazione {
  id: number;
  commessa: Commessa;
  cliente: Cliente;
  utente: Utente;
  assegnatoDa: Utente;
  assegnazioneAt: string;
  startAt?: string;
  endAt?: string;
  fotoAllegato?: { id: number; nomeFile: string; storagePath: string };
  note?: string;
  isDeleted?: boolean;
}

const AssegnazioniPage = () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [assegnazioni, setAssegnazioni] = useState<Assegnazione[]>([]);
  const [dipendenti, setDipendenti] = useState<Utente[]>([]);
  const [selectedDipendente, setSelectedDipendente] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [ruolo, setRuolo] = useState<'ADMIN' | 'SUPERVISORE' | 'DIPENDENTE'>('DIPENDENTE');
  const [utenteCorrente, setUtenteCorrente] = useState<Utente | null>(null);

  // form principale
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Assegnazione | null>(null);
  const [formData, setFormData] = useState<{ commessa?: Commessa; cliente?: Cliente; note: string }>({
    note: '',
  });

  // modali di selezione
  const [openCommessaModal, setOpenCommessaModal] = useState(false);
  const [openClienteModal, setOpenClienteModal] = useState(false);

  // dati per modali
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [searchCommessa, setSearchCommessa] = useState('');
  const [searchCliente, setSearchCliente] = useState('');

  // caricamento iniziale
  useEffect(() => {
    const loadInitialData = async () => {
      const userRes = await fetch(`${backendUrl}/auth/me`, { credentials: 'include' });
      const userData = await userRes.json();
      setUtenteCorrente(userData);
      setRuolo(userData.role);
      setSelectedDipendente(userData.id);

      const dipRes = await fetch(`${backendUrl}/api/utenti`, { credentials: 'include' });
      setDipendenti(await dipRes.json());
    };
    loadInitialData();
  }, []);

  // carica assegnazioni
  useEffect(() => {
    if (!selectedDipendente) return;
    const fetchData = async () => {
      const res = await fetch(
        `${backendUrl}/api/assegnazioni?utenteId=${selectedDipendente}&date=${selectedDate
          .toISOString()
          .split('T')[0]}`,
        { credentials: 'include' }
      );
      setAssegnazioni(await res.json());
    };
    fetchData();
  }, [selectedDipendente, selectedDate]);

  // ricerca commesse/clienti
  const loadCommesse = async () => {
    const res = await fetch(`${backendUrl}/api/commesse?search=${searchCommessa}`, { credentials: 'include' });
    setCommesse(await res.json());
  };
  const loadClienti = async () => {
    const res = await fetch(`${backendUrl}/api/clienti?search=${searchCliente}`, { credentials: 'include' });
    setClienti(await res.json());
  };

  // navigazione date
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // stato assegnazione
  const getStatus = (a: Assegnazione) => {
    if (a.endAt) return 'Completata';
    if (a.startAt) return 'In corso';
    return 'Non iniziata';
  };
  const statusColor = (a: Assegnazione) => {
    if (a.endAt) return 'success.main';
    if (a.startAt) return 'info.main';
    return 'grey.500';
  };

  // azioni dipendente
  const handleStart = async (id: number) => {
    await fetch(`${backendUrl}/api/assegnazioni/${id}/start`, { method: 'PUT', credentials: 'include' });
    setAssegnazioni(prev =>
      prev.map(a => (a.id === id ? { ...a, startAt: new Date().toISOString() } : a))
    );
  };

  const handleEnd = async (id: number) => {
    await fetch(`${backendUrl}/api/assegnazioni/${id}/end`, { method: 'PUT', credentials: 'include' });
    setAssegnazioni(prev =>
      prev.map(a => (a.id === id ? { ...a, endAt: new Date().toISOString() } : a))
    );
  };

  const handleUploadFoto = async (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    await fetch(`${backendUrl}/api/assegnazioni/${id}/upload-foto`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });
    alert('Foto caricata!');
  };

  // form gestione assegnazione
  const handleOpenForm = (a?: Assegnazione) => {
    if (a) {
      setEditing(a);
      setFormData({
        commessa: a.commessa,
        cliente: a.cliente,
        note: a.note || '',
      });
    } else {
      setEditing(null);
      setFormData({ note: '' });
    }
    setOpenForm(true);
  };

 const handleSubmit = async () => {
  if (!formData.commessa || !formData.cliente) {
    alert('Seleziona commessa e cliente');
    return;
  }

  const body = {
    commessaId: formData.commessa.id,
    clienteId: formData.cliente.id,
    utenteId: selectedDipendente,
    note: formData.note,
    assegnazioneAt: selectedDate.toISOString(),
  };

  const method = editing ? 'PUT' : 'POST';
  const url = editing
    ? `${backendUrl}/api/assegnazioni/${editing.id}`
    : `${backendUrl}/api/assegnazioni`;

  await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  setOpenForm(false);
  setEditing(null);
  const refetch = await fetch(
    `${backendUrl}/api/assegnazioni?utenteId=${selectedDipendente}&date=${selectedDate
      .toISOString()
      .split('T')[0]}`,
    { credentials: 'include' }
  );
  setAssegnazioni(await refetch.json());
};


  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <TextField
          select
          label="Dipendente"
          size="small"
          value={selectedDipendente || ''}
          onChange={e => setSelectedDipendente(Number(e.target.value))}
          disabled={ruolo === 'DIPENDENTE'}
          sx={{ width: 250 }}
        >
          {dipendenti.map(d => (
            <MenuItem key={d.id} value={d.id}>
              {d.nome}
            </MenuItem>
          ))}
        </TextField>

        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => changeDate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography fontWeight={600}>
            {selectedDate.toLocaleDateString('it-IT', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
            })}
          </Typography>
          <IconButton onClick={() => changeDate(1)}>
            <ArrowForward />
          </IconButton>
        </Box>

        {ruolo === 'ADMIN' && (
          <Button startIcon={<Add />} variant="contained" size="small" onClick={() => handleOpenForm()}>
            Nuova assegnazione
          </Button>
        )}
      </Box>

      {/* LISTA */}
      <Grid container spacing={2}>
        {assegnazioni.map(a => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  {a.commessa.codice} — {a.cliente.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {a.note || 'Nessuna nota'}
                </Typography>
                <Typography mt={2} color={statusColor(a)} fontWeight={600}>
                  {getStatus(a)}
                </Typography>
              </CardContent>
              <CardActions>
                {ruolo === 'ADMIN' && (
                  <>
                    <IconButton onClick={() => handleOpenForm(a)}>
                      <Edit />
                    </IconButton>
                    <IconButton>
                      <Delete />
                    </IconButton>
                  </>
                )}
                {ruolo === 'DIPENDENTE' && !a.startAt && (
                  <Button size="small" onClick={() => handleStart(a.id)}>
                    Inizia
                  </Button>
                )}
                {ruolo === 'DIPENDENTE' && a.startAt && !a.endAt && (
                  <Button size="small" onClick={() => handleEnd(a.id)}>
                    Termina
                  </Button>
                )}
                {a.commessa.pdfAllegato && (
                  <IconButton
                    onClick={() =>
                      window.open(`${backendUrl}/storage/${a.commessa.pdfAllegato?.storagePath}`, '_blank')
                    }
                  >
                    <PictureAsPdf />
                  </IconButton>
                )}
                {ruolo === 'DIPENDENTE' && a.endAt && (
                  <IconButton component="label">
                    <PhotoCamera />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={e => e.target.files && handleUploadFoto(a.id, e.target.files[0])}
                    />
                  </IconButton>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* DIALOG NUOVA/MODIFICA */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Modifica Assegnazione' : 'Nuova Assegnazione'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              label="Commessa"
              value={formData.commessa?.codice || ''}
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setOpenCommessaModal(true);
                loadCommesse();
              }}
            >
              Seleziona
            </Button>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              label="Cliente"
              value={formData.cliente?.nome || ''}
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setOpenClienteModal(true);
                loadClienti();
              }}
            >
              Seleziona
            </Button>
          </Box>

          <TextField
            label="Note"
            multiline
            minRows={2}
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Annulla</Button>
          <Button onClick={handleSubmit} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODALE SELEZIONA COMMESSA */}
      <Dialog open={openCommessaModal} onClose={() => setOpenCommessaModal(false)} fullWidth maxWidth="md">
        <DialogTitle>Seleziona Commessa</DialogTitle>
        <DialogContent>
          <TextField
            placeholder="Cerca per codice o descrizione"
            value={searchCommessa}
            onChange={e => setSearchCommessa(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadCommesse()}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <Box display="flex" flexDirection="column" gap={1}>
            {commesse.map(c => (
              <Paper
                key={c.id}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                }}
                onClick={() => {
                  setFormData({ ...formData, commessa: c });
                  setOpenCommessaModal(false);
                }}
              >
                <Typography>
                  {c.codice} — {c.descrizione}
                </Typography>
                {c.pdfAllegato && (
                  <IconButton
                    onClick={e => {
                      e.stopPropagation();
                      window.open(`${backendUrl}/storage/${c.pdfAllegato?.storagePath}`, '_blank');
                    }}
                  >
                    <PictureAsPdf fontSize="small" />
                  </IconButton>
                )}
              </Paper>
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      {/* MODALE SELEZIONA CLIENTE */}
      <Dialog open={openClienteModal} onClose={() => setOpenClienteModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Seleziona Cliente</DialogTitle>
        <DialogContent>
          <TextField
            placeholder="Cerca cliente per nome"
            value={searchCliente}
            onChange={e => setSearchCliente(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadClienti()}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <Box display="flex" flexDirection="column" gap={1}>
            {clienti.map(c => (
              <Paper
                key={c.id}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                }}
                onClick={() => {
                  setFormData({ ...formData, cliente: c });
                  setOpenClienteModal(false);
                }}
              >
                <Typography>{c.nome}</Typography>
              </Paper>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default AssegnazioniPage;
