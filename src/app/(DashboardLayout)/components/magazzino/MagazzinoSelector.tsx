'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Magazzino {
  id: number;
  nome: string;
}

const MagazzinoSelector = ({ onSelect }: { onSelect: (id: number | null) => void }) => {
  const [magazzini, setMagazzini] = useState<Magazzino[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [open, setOpen] = useState(false);
  const [nomeMagazzino, setNomeMagazzino] = useState('');

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const fetchMagazzini = async () => {
    const res = await fetch(`${backendUrl}/api/magazzini`, { credentials: 'include' });
    const data: Magazzino[] = await res.json();
    setMagazzini(data);
  };

  useEffect(() => {
    fetchMagazzini();
  }, []);

  const handleCreate = async () => {
    await fetch(`${backendUrl}/api/magazzini`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeMagazzino }),
    });
    setOpen(false);
    setNomeMagazzino('');
    await fetchMagazzini();
  };

  const handleSelect = (value: string | number) => {
    const id = Number(value);
    setSelected(id);
    onSelect(id);
  };

  const handleConfirmDelete = async () => {
    if (!selected) return;
    await fetch(`${backendUrl}/api/magazzini/${selected}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setConfirmDeleteOpen(false);
    setSelected('');
    onSelect(null);
    fetchMagazzini();
  };

  const currentMag = magazzini.find((m) => m.id === selected);

  return (
    <Box display="flex" gap={2} alignItems="center">
      <TextField
        select
        label="Seleziona Magazzino"
        value={selected}
        onChange={(e) => handleSelect(e.target.value)}
        size="small"
        sx={{ width: 250 }}
      >
        {magazzini.map((m) => (
          <MenuItem key={m.id} value={m.id}>
            {m.nome}
          </MenuItem>
        ))}
      </TextField>

      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        Nuovo Magazzino
      </Button>

      <Button
        variant="outlined"
        size="small"
        color="error"
        disabled={!selected}
        onClick={() => setConfirmDeleteOpen(true)}
      >
        Elimina Magazzino
      </Button>

      {/* Dialog nuovo magazzino */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Nuovo Magazzino</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome"
            fullWidth
            size="small"
            value={nomeMagazzino}
            onChange={(e) => setNomeMagazzino(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annulla</Button>
          <Button onClick={handleCreate} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog conferma delete */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Elimina Magazzino</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare il magazzino{' '}
            <strong>{currentMag?.nome}</strong>?
            <br />
            Verranno eliminati anche articoli e movimenti collegati.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Annulla</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MagazzinoSelector;
