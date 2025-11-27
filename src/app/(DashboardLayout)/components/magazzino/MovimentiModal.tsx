'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Box,
  Typography,
} from '@mui/material';

import { useWS } from '@/app/(DashboardLayout)/ws/WSContext';
import { IMessage } from '@stomp/stompjs';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Movimento {
  id: number;
  quantita: number;
  movimentoAt: string;
  descrizione?: string;
  inventario?: {
    id: number;
    nome: string;
  };
}


const MovimentiModal = ({
  open,
  onClose,
  articolo,
  magazzinoId,
}: {
  open: boolean;
  onClose: () => void;
  articolo: any | null;
  magazzinoId: number;
}) => {
  const { subscribe } = useWS();

  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

const fetchMovimenti = async (fromParam?: string, toParam?: string) => {
  const f = fromParam ?? from;
  const t = toParam ?? to;

  const params = new URLSearchParams();
  if (f) params.append('from', f);
  if (t) params.append('to', t);

  let url: string;
  if (articolo && articolo.id) {
    url = `${backendUrl}/api/inventario/movimenti/articolo/${articolo.id}`;
  } else {
    url = `${backendUrl}/api/inventario/movimenti/magazzino/${magazzinoId}`;
  }

  const res = await fetch(`${url}?${params.toString()}`, { credentials: 'include' });
  const data = await res.json();
  setMovimenti(data);
};


  // reset filtri e lista ad ogni apertura
useEffect(() => {
  if (!open) return;

  const now = new Date();
  const inizio = new Date(now.getFullYear(), now.getMonth(), 1);
  const fine = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const defaultFrom = inizio.toISOString().split('T')[0];
  const defaultTo = fine.toISOString().split('T')[0];

  setFrom(defaultFrom);
  setTo(defaultTo);
  setMovimenti([]);
  fetchMovimenti(defaultFrom, defaultTo);
}, [open, articolo, magazzinoId]);


  // refresh via WS
  useEffect(() => {
    const unsub = subscribe((msg: IMessage) => {
      try {
        const payload = JSON.parse(msg.body);
        if (payload.tipo === 'REFRESH' || payload.tipoEvento === 'REFRESH') {
if (open) {
  fetchMovimenti();
}

        }
      } catch {}
    });
    return () => unsub();
  }, [subscribe, open]);

  const movFiltrati = movimenti.filter((m) => {
    const d = m.movimentoAt.split('T')[0];
    return (!from || d >= from) && (!to || d <= to);
  });

  const titolo = articolo ? `Movimenti — ${articolo.nome}` : 'Movimenti Magazzino';

  // 3) bottone per generare report PDF (stub)
const handleGeneratePdf = async () => {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const res = await fetch(
    `${backendUrl}/api/inventario/movimenti/magazzino/${magazzinoId}/report/pdf?${params}`,
    { credentials: "include" }
  );

  if (!res.ok) {
    alert("Errore durante la generazione del PDF");
    return;
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `report-magazzino-${magazzinoId}.pdf`;
  link.click();
};


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{titolo}</DialogTitle>

      <DialogContent>
        <Box display="flex" gap={2} mb={2} alignItems="center">
          <TextField
            label="Da"
            type="date"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="A"
            type="date"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

<Button
  variant="outlined"
  size="small"
  onClick={() => fetchMovimenti()}
>
  Aggiorna
</Button>


          {!articolo && (
            <Button
              variant="contained"
              size="small"
              onClick={handleGeneratePdf}
            >
              Genera PDF
            </Button>
          )}
        </Box>

        <Table size="small">
<TableHead>
  <TableRow>
    {!articolo && <TableCell>Articolo</TableCell>}
    <TableCell>Data</TableCell>
    <TableCell>Quantità</TableCell>
    <TableCell>Descrizione</TableCell>
  </TableRow>
</TableHead>

<TableBody>
  {movFiltrati.map((m) => (
    <TableRow key={m.id}>
      
      {!articolo && (
        <TableCell>{m.inventario?.nome || '-'}</TableCell>
      )}

      <TableCell>
        {new Date(m.movimentoAt).toLocaleString()}
      </TableCell>

      <TableCell
        style={{ color: m.quantita > 0 ? 'green' : 'red', fontWeight: 600 }}
      >
        {m.quantita}
      </TableCell>

      <TableCell>{m.descrizione || '-'}</TableCell>
    </TableRow>
  ))}


            {movFiltrati.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography align="center" color="text.secondary">
                    Nessun movimento trovato
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MovimentiModal;
