'use client';

import { useWS } from '@/app/(DashboardLayout)/ws/WSContext';
import { IMessage } from '@stomp/stompjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
import { Add, Delete, Edit, PictureAsPdf } from '@mui/icons-material';

interface Utente {
  id: number;
  nome?: string;
  cognome?: string;
  username: string;
}

interface TabellaMarcia {
  id: number;
  utente: Utente;
  data: string;
  dataRientro?: string;
  targa: string;
  orarioUscita?: string;
  orarioRientro?: string;
  kmPartenza: number;
  kmRientro?: number;
  guasti: boolean;
  rifornimento: boolean;
  importoRifornimento?: number;
  metodoPagamento?: string;
  controlliPrePartenza?: string;
  guastiRotture?: string;
  note?: string;
  inviatoAt?: string;
}

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = {
  data: today(),
  dataRientro: today(),
  targa: '',
  orarioUscita: '',
  orarioRientro: '',
  kmPartenza: '',
  kmRientro: '',
  guasti: false,
  rifornimento: false,
  importoRifornimento: '',
  metodoPagamento: '',
  controlliPrePartenza: '',
  guastiRotture: '',
  note: '',
};

const TabellaMarciaComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [items, setItems] = useState<TabellaMarcia[]>([]);
  const [utenti, setUtenti] = useState<Utente[]>([]);
  const [role, setRole] = useState('');
  const [selectedUtenteId, setSelectedUtenteId] = useState('');
  const [selectedDate, setSelectedDate] = useState(today());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TabellaMarcia | null>(null);
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
    const res = await fetch(`${backendUrl}/api/tabelle-marcia?${params.toString()}`, { credentials: 'include' });
    if (res.ok && seq === fetchSeq.current) setItems(await res.json());
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

  const openForm = (item?: TabellaMarcia) => {
    if (item) {
      setEditing(item);
      setFormData({
        data: item.data,
        dataRientro: item.dataRientro || item.data,
        targa: item.targa || '',
        orarioUscita: item.orarioUscita?.slice(0, 5) || '',
        orarioRientro: item.orarioRientro?.slice(0, 5) || '',
        kmPartenza: String(item.kmPartenza ?? ''),
        kmRientro: String(item.kmRientro ?? ''),
        guasti: Boolean(item.guasti),
        rifornimento: Boolean(item.rifornimento),
        importoRifornimento: String(item.importoRifornimento ?? ''),
        metodoPagamento: item.metodoPagamento || '',
        controlliPrePartenza: item.controlliPrePartenza || '',
        guastiRotture: item.guastiRotture || '',
        note: item.note || '',
      });
    } else {
      setEditing(null);
      setFormData({ ...emptyForm, data: selectedDate, dataRientro: selectedDate });
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
        ? `${backendUrl}/api/tabelle-marcia/${editing.id}`
        : `${backendUrl}/api/tabelle-marcia`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          kmPartenza: Number(formData.kmPartenza),
          kmRientro: formData.kmRientro ? Number(formData.kmRientro) : null,
          importoRifornimento: formData.importoRifornimento ? Number(formData.importoRifornimento) : null,
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

  const sendItem = async (item: TabellaMarcia) => {
    setActionLoading(true);
    try {
      await fetch(`${backendUrl}/api/tabelle-marcia/${item.id}/invia`, {
        method: 'PUT',
        credentials: 'include',
      });
      fetchItems();
    } finally {
      setActionLoading(false);
    }
  };

  const deleteItem = async (item: TabellaMarcia) => {
    if (!confirm('Eliminare questa tabella di marcia?')) return;
    setActionLoading(true);
    try {
      await fetch(`${backendUrl}/api/tabelle-marcia/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      fetchItems();
    } finally {
      setActionLoading(false);
    }
  };

  const downloadPdf = (item: TabellaMarcia) => {
    window.open(`${backendUrl}/api/tabelle-marcia/${item.id}/report/pdf`, '_blank');
  };

  const formatDateTime = (date?: string, time?: string) => {
    const shortTime = time?.slice(0, 5) || '-';
    if (!date) return shortTime;
    return `${date.split('-').reverse().join('/')} ${shortTime}`;
  };

  const canMutateItem = (item: TabellaMarcia) => role === 'ADMIN' || !item.inviatoAt;

  return (
    <Paper elevation={3} sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: { xs: 2, sm: 3 }, width: '100%', boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 2, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={600}>Tabella di marcia</Typography>
        <Button startIcon={<Add />} variant="contained" size="small" onClick={() => openForm()} disabled={actionLoading} fullWidth={isMobile}>
          Nuova marcia
        </Button>
        <TextField type="date" label="Giorno" size="small" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth={isMobile} />
        {role === 'ADMIN' && (
          <TextField select label="Operatore" size="small" value={selectedUtenteId} onChange={(e) => setSelectedUtenteId(e.target.value)} fullWidth={isMobile}>
            {utenti.map(utente => (
              <MenuItem key={utente.id} value={utente.id}>
                {utente.nome || utente.username} {utente.cognome || ''}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, width: '100%' }}>
          {items.map(item => (
            <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{item.targa}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(item.data, item.orarioUscita)} - {formatDateTime(item.dataRientro || item.data, item.orarioRientro)}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>{item.inviatoAt ? 'Inviato' : 'Bozza'}</Typography>
              </Box>
              <Typography variant="body2" mt={1}>Km: {item.kmPartenza} - {item.kmRientro || '-'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                Rifornimento: {item.rifornimento ? `${item.importoRifornimento || ''} ${item.metodoPagamento || ''}` : 'No'}
              </Typography>
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
                {role === 'ADMIN' && (
                  <Button size="small" startIcon={<PictureAsPdf fontSize="small" />} onClick={() => downloadPdf(item)} disabled={actionLoading}>
                    PDF
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <TableContainer sx={{ display: 'block', overflowX: 'auto', overflowY: 'hidden', width: '100%', maxWidth: '100%', minWidth: 0, WebkitOverflowScrolling: 'touch' }}>
          <Table sx={{ minWidth: 840 }}>
            <TableHead>
              <TableRow>
                <TableCell>Utente</TableCell>
                <TableCell>Targa</TableCell>
                <TableCell>Orari</TableCell>
                <TableCell>Km</TableCell>
                <TableCell>Rifornimento</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.utente.nome || item.utente.username} {item.utente.cognome || ''}</TableCell>
                  <TableCell>{item.targa}</TableCell>
                  <TableCell>{formatDateTime(item.data, item.orarioUscita)} - {formatDateTime(item.dataRientro || item.data, item.orarioRientro)}</TableCell>
                  <TableCell>{item.kmPartenza} - {item.kmRientro || '-'}</TableCell>
                  <TableCell>{item.rifornimento ? `${item.importoRifornimento || ''} ${item.metodoPagamento || ''}` : 'No'}</TableCell>
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
                    {role === 'ADMIN' && (
                      <IconButton size="small" onClick={() => downloadPdf(item)} disabled={actionLoading}>
                        <PictureAsPdf fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={closeForm} fullWidth maxWidth="sm" fullScreen={isMobile}>
        <DialogTitle>{editing ? 'Modifica tabella di marcia' : 'Nuova tabella di marcia'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, px: { xs: 2, sm: 3 } }}>
          <TextField type="date" label="Giorno uscita" size="small" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value, dataRientro: formData.dataRientro || e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="Targa mezzo" size="small" value={formData.targa} onChange={(e) => setFormData({ ...formData, targa: e.target.value.toUpperCase() })} />
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField type="time" label="Ora uscita" size="small" fullWidth value={formData.orarioUscita} onChange={(e) => setFormData({ ...formData, orarioUscita: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField type="date" label="Giorno rientro" size="small" fullWidth value={formData.dataRientro} onChange={(e) => setFormData({ ...formData, dataRientro: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField type="time" label="Ora rientro" size="small" fullWidth value={formData.orarioRientro} onChange={(e) => setFormData({ ...formData, orarioRientro: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField label="Km in uscita" type="number" size="small" fullWidth value={formData.kmPartenza} onChange={(e) => setFormData({ ...formData, kmPartenza: e.target.value })} />
            <TextField label="Km in entrata" type="number" size="small" fullWidth value={formData.kmRientro} onChange={(e) => setFormData({ ...formData, kmRientro: e.target.value })} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControlLabel control={<Checkbox checked={formData.rifornimento} onChange={(e) => setFormData({ ...formData, rifornimento: e.target.checked })} />} label="Rifornimento" />
            <FormControlLabel control={<Checkbox checked={formData.guasti} onChange={(e) => setFormData({ ...formData, guasti: e.target.checked })} />} label="Guasti o rotture" />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField label="Importo rifornimento" type="number" size="small" fullWidth value={formData.importoRifornimento} onChange={(e) => setFormData({ ...formData, importoRifornimento: e.target.value })} />
            <TextField label="Metodo pagamento" size="small" fullWidth value={formData.metodoPagamento} onChange={(e) => setFormData({ ...formData, metodoPagamento: e.target.value })} />
          </Box>
          <TextField label="Controlli fatti prima di partire" size="small" multiline minRows={4} value={formData.controlliPrePartenza} onChange={(e) => setFormData({ ...formData, controlliPrePartenza: e.target.value })} />
          <TextField label="Eventuali guasti e rotture" size="small" multiline minRows={4} value={formData.guastiRotture} onChange={(e) => setFormData({ ...formData, guastiRotture: e.target.value })} />
          <TextField label="Note" size="small" multiline minRows={2} value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch' }}>
          <Button onClick={closeForm} disabled={actionLoading} fullWidth={isMobile}>Annulla</Button>
          <Button onClick={() => save(true)} variant="contained" disabled={actionLoading} fullWidth={isMobile}>Salva e invia</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TabellaMarciaComponent;
