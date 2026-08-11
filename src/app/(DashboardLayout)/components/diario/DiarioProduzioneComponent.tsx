'use client';

import { useWS } from '@/app/(DashboardLayout)/ws/WSContext';
import { IMessage } from '@stomp/stompjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';

interface Commessa {
  id: number;
  codice: string;
  descrizione?: string;
}

interface Utente {
  id: number;
  nome?: string;
  cognome?: string;
  username: string;
}

interface DiarioProduzione {
  id: number;
  utente: Utente;
  commessa: Commessa;
  clienteCommessa?: string;
  data: string;
  oraInizio: string;
  oraFine: string;
  descrizione: string;
  tipoLavorazione?: string;
  attrezzaturaDanneggiata?: string;
  materialeUtilizzatoExtra?: string;
  consumabiliPrelevati?: string;
  inviatoAt?: string;
}

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = {
  commessaId: '',
  clienteCommessa: '',
  data: today(),
  oraInizio: '',
  oraFine: '',
  descrizione: '',
  tipoLavorazione: '',
  attrezzaturaDanneggiata: '',
  materialeUtilizzatoExtra: '',
  consumabiliPrelevati: '',
};

const DiarioProduzioneComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [items, setItems] = useState<DiarioProduzione[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [role, setRole] = useState('');
  const [selectedUtenteId, setSelectedUtenteId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DiarioProduzione | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [actionLoading, setActionLoading] = useState(false);
  const fetchSeq = useRef(0);

  const fetchItems = async () => {
    const seq = ++fetchSeq.current;
    if (role === 'ADMIN' && !selectedUtenteId) {
      setItems([]);
      return;
    }
    const params = new URLSearchParams({ date: selectedDate });
    if (role === 'ADMIN' && selectedUtenteId) params.set('utenteId', selectedUtenteId);
    const res = await fetch(`${backendUrl}/api/diario-produzione?${params.toString()}`, { credentials: 'include' });
    if (res.ok && seq === fetchSeq.current) setItems(await res.json());
  };

  const fetchCommesse = async () => {
    const res = await fetch(`${backendUrl}/api/commesse/existing`, { credentials: 'include' });
    if (res.ok) setCommesse(await res.json());
  };

  const fetchCurrentUser = async () => {
    const res = await fetch(`${backendUrl}/auth/me`, { credentials: 'include' });
    if (!res.ok) return;
    const user = await res.json();
    setRole(user.role);
    if (user.role !== 'ADMIN') setSelectedUtenteId(String(user.id));
  };

  const fetchUtenti = async () => {
    const res = await fetch(`${backendUrl}/api/utenti/operativi`, { credentials: 'include' });
    if (!res.ok) return;
    const data: Utente[] = await res.json();
    setUtenti(data);
    if (!selectedUtenteId && data.length > 0) setSelectedUtenteId(String(data[0].id));
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchCommesse();
  }, []);

  useEffect(() => {
    if (role === 'ADMIN') fetchUtenti();
  }, [role]);

  useEffect(() => {
    if (role) fetchItems();
  }, [selectedDate, selectedUtenteId, role]);

  const { subscribe } = useWS();

  useEffect(() => {
    const unsubscribe = subscribe((msg: IMessage) => {
      try {
        const payload = msg.body ? JSON.parse(msg.body) : {};
        const tipo = payload.tipoEvento ?? payload.tipo ?? payload.tipo_evento;
        if (tipo === 'REFRESH' || tipo === 'MSG_REFRESH') fetchItems();
      } catch {}
    });
    return () => unsubscribe();
  }, [subscribe, selectedDate, selectedUtenteId, role]);

  const openForm = (item?: DiarioProduzione) => {
    if (item) {
      setEditing(item);
      setFormData({
        commessaId: String(item.commessa.id),
        clienteCommessa: item.clienteCommessa || item.commessa.codice,
        data: item.data,
        oraInizio: item.oraInizio?.slice(0, 5) || '',
        oraFine: item.oraFine?.slice(0, 5) || '',
        descrizione: item.descrizione || '',
        tipoLavorazione: item.tipoLavorazione || '',
        attrezzaturaDanneggiata: item.attrezzaturaDanneggiata || '',
        materialeUtilizzatoExtra: item.materialeUtilizzatoExtra || '',
        consumabiliPrelevati: item.consumabiliPrelevati || '',
      });
    } else {
      setEditing(null);
      setFormData({ ...emptyForm, data: selectedDate });
    }
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setEditing(null);
  };

  const save = async (invia = false) => {
    setActionLoading(true);
    try {
      const url = editing
        ? `${backendUrl}/api/diario-produzione/${editing.id}`
        : `${backendUrl}/api/diario-produzione`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          commessaId: Number(formData.commessaId),
          invia,
        }),
      });
      if (!res.ok) {
        alert(await res.text());
        return;
      }
      closeForm();
      fetchItems();
    } finally {
      setActionLoading(false);
    }
  };

  const sendItem = async (item: DiarioProduzione) => {
    setActionLoading(true);
    try {
      await fetch(`${backendUrl}/api/diario-produzione/${item.id}/invia`, {
        method: 'PUT',
        credentials: 'include',
      });
      fetchItems();
    } finally {
      setActionLoading(false);
    }
  };

  const deleteItem = async (item: DiarioProduzione) => {
    if (!confirm('Eliminare questa riga di diario?')) return;
    setActionLoading(true);
    try {
      await fetch(`${backendUrl}/api/diario-produzione/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchItems();
    } finally {
      setActionLoading(false);
    }
  };

  const downloadPdf = () => {
    const params = new URLSearchParams({ data: selectedDate });
    if (role === 'ADMIN' && selectedUtenteId) params.set('utenteId', selectedUtenteId);
    window.open(`${backendUrl}/api/diario-produzione/report/pdf?${params.toString()}`, '_blank');
  };

  const canMutateItem = (item: DiarioProduzione) => role === 'ADMIN' || !item.inviatoAt;

  return (
    <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: { xs: 2, sm: 3 }, width: '100%', boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>Diario produzione giornaliero</Typography>
        <Button startIcon={<Add />} variant="contained" size="small" onClick={() => openForm()} disabled={actionLoading} fullWidth={isMobile}>
          Nuova riga
        </Button>
        <TextField
          type="date"
          label="Giorno"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth={isMobile}
        />
        {role === 'ADMIN' && (
          <TextField select label="Operatore" size="small" value={selectedUtenteId} onChange={(e) => setSelectedUtenteId(e.target.value)} fullWidth={isMobile}>
            {utenti.map(utente => (
              <MenuItem key={utente.id} value={utente.id}>
                {utente.nome || utente.username} {utente.cognome || ''}
              </MenuItem>
            ))}
          </TextField>
        )}
        {role === 'ADMIN' && (
          <Button variant="outlined" size="small" onClick={downloadPdf} disabled={actionLoading || !selectedUtenteId} fullWidth={isMobile}>
            PDF
          </Button>
        )}
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, width: '100%' }}>
          {items.map(item => (
            <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{item.clienteCommessa || item.commessa.codice}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.oraInizio?.slice(0, 5)} - {item.oraFine?.slice(0, 5)}</Typography>
                </Box>
                <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{item.inviatoAt ? 'Inviato' : 'Bozza'}</Typography>
              </Box>
              <Typography variant="body2" mt={1} sx={{ overflowWrap: 'anywhere' }}>{item.tipoLavorazione || item.descrizione}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <IconButton size="small" onClick={() => openForm(item)} disabled={actionLoading || !canMutateItem(item)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => deleteItem(item)} disabled={actionLoading || !canMutateItem(item)}>
                  <Delete fontSize="small" />
                </IconButton>
                {!item.inviatoAt && (
                  <Button size="small" onClick={() => sendItem(item)} disabled={actionLoading}>
                    Invia
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <TableContainer sx={{ display: 'block', overflowX: 'auto', overflowY: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, WebkitOverflowScrolling: 'touch' }}>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Utente</TableCell>
                <TableCell>Orario</TableCell>
                <TableCell>Cliente / Commessa</TableCell>
                <TableCell>Tipo lavorazione</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.utente.nome || item.utente.username} {item.utente.cognome || ''}</TableCell>
                  <TableCell>{item.oraInizio?.slice(0, 5)} - {item.oraFine?.slice(0, 5)}</TableCell>
                  <TableCell>{item.clienteCommessa || item.commessa.codice}</TableCell>
                  <TableCell>{item.tipoLavorazione || item.descrizione}</TableCell>
                  <TableCell>{item.inviatoAt ? 'Inviato' : 'Bozza'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openForm(item)} disabled={actionLoading || !canMutateItem(item)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteItem(item)} disabled={actionLoading || !canMutateItem(item)}>
                      <Delete fontSize="small" />
                    </IconButton>
                    {!item.inviatoAt && (
                      <Button size="small" onClick={() => sendItem(item)} disabled={actionLoading}>
                        Invia
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={closeForm} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{editing ? 'Modifica diario' : 'Nuova riga diario'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, px: { xs: 2, sm: 3 } }}>
          <TextField
            select
            label="Commessa"
            size="small"
            value={formData.commessaId}
            onChange={(e) => {
              const commessa = commesse.find(c => c.id === Number(e.target.value));
              setFormData({
                ...formData,
                commessaId: e.target.value,
                clienteCommessa: formData.clienteCommessa || commessa?.codice || '',
              });
            }}
          >
            {commesse.map(commessa => (
              <MenuItem key={commessa.id} value={commessa.id}>
                {commessa.codice} {commessa.descrizione ? `- ${commessa.descrizione}` : ''}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Cliente / Commessa" size="small" value={formData.clienteCommessa} onChange={(e) => setFormData({ ...formData, clienteCommessa: e.target.value })} />
          <TextField type="date" label="Giorno" size="small" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} InputLabelProps={{ shrink: true }} />
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField type="time" label="Da" size="small" fullWidth value={formData.oraInizio} onChange={(e) => setFormData({ ...formData, oraInizio: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField type="time" label="A" size="small" fullWidth value={formData.oraFine} onChange={(e) => setFormData({ ...formData, oraFine: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Box>
          <TextField label="Tipo di lavorazione" size="small" value={formData.tipoLavorazione} onChange={(e) => setFormData({ ...formData, tipoLavorazione: e.target.value })} />
          <TextField label="Attivita svolta" size="small" multiline minRows={3} value={formData.descrizione} onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })} />
          <TextField label="Attrezzatura danneggiata" size="small" multiline minRows={2} value={formData.attrezzaturaDanneggiata} onChange={(e) => setFormData({ ...formData, attrezzaturaDanneggiata: e.target.value })} />
          <TextField label="Materiale utilizzato extra" size="small" multiline minRows={2} value={formData.materialeUtilizzatoExtra} onChange={(e) => setFormData({ ...formData, materialeUtilizzatoExtra: e.target.value })} />
          <TextField label="Consumabili prelevati dal magazzino" size="small" multiline minRows={2} value={formData.consumabiliPrelevati} onChange={(e) => setFormData({ ...formData, consumabiliPrelevati: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch' }}>
          <Button onClick={closeForm} disabled={actionLoading} fullWidth={isMobile}>Annulla</Button>
          <Button onClick={() => save(true)} variant="contained" disabled={actionLoading} fullWidth={isMobile}>Salva e invia</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DiarioProduzioneComponent;
