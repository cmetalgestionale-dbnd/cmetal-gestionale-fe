'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

const MovimentoFormModal = ({
  open,
  onClose,
  articolo,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  articolo: any;
  onSaved: () => void;
}) => {
  const [quantita, setQuantita] = useState<string>('');
  const [descrizione, setDescrizione] = useState('');

  // reset ogni volta che apro la modale
  useEffect(() => {
    if (open) {
      setQuantita('');
      setDescrizione('');
    }
  }, [open]);

  const handleSubmitMovimento = async () => {
    const trimmed = quantita.replace(',', '.').trim();

    // niente movimento se campo vuoto o solo "-"
    if (!trimmed || trimmed === '-') return;

    const value = Number(trimmed);
    if (Number.isNaN(value) || value === 0) return;

    const payload = {
      inventario: { id: articolo.id },
      quantita: value,
      descrizione,
      movimentoAt: new Date().toISOString(),
    };

    await fetch(`${backendUrl}/api/inventario/movimenti`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    onClose();
    onSaved();
  };

  // 🔁 Riordino: aggiunge alla quantità dell'articolo la "quantità in riordino"
  // (crea un movimento di +quantitaInRiordino e azzera quantitaInRiordino)
  const handleRiordinoDaQuantitaInRiordino = async () => {
    const daRiordino = articolo.quantitaInRiordino ?? 0;
    if (!daRiordino || daRiordino <= 0) return;

    // 1) Movimento di carico
    const movimentoPayload = {
      inventario: { id: articolo.id },
      quantita: daRiordino,
      descrizione: 'Riordino da quantità in riordino',
      movimentoAt: new Date().toISOString(),
    };

    await fetch(`${backendUrl}/api/inventario/movimenti`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movimentoPayload),
    });

    onClose();
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Registra Movimento — {articolo.nome}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          label="Quantità (positiva = carico, negativa = scarico)"
          type="text"
          size="small"
          value={quantita}
          onChange={(e) => setQuantita(e.target.value)}
        />

        <TextField
          label="Descrizione"
          size="small"
          multiline
          minRows={2}
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
        />
      </DialogContent>

      <DialogActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onClose}>Annulla</Button>

        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={handleRiordinoDaQuantitaInRiordino}>
            Registra riordino da quantità in riordino
          </Button>
          <Button variant="contained" onClick={handleSubmitMovimento}>
            Registra movimento
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default MovimentoFormModal;
