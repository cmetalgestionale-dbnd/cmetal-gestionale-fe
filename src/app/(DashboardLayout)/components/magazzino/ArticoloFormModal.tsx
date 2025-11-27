'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Articolo {
  id?: number;
  nome: string;
  categoria: string;
  descrizione?: string;
  prezzoUnitario: number;
  livelloRiordino: number;
  quantitaInRiordino: number;
  fuoriProduzione: boolean;
  quantitaMagazzino?: number; // per non perderla in update
}

const ArticoloFormModal = ({
  open,
  onClose,
  articolo,
  magazzinoId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  articolo: any | null;
  magazzinoId: number;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<Articolo>({
    nome: '',
    categoria: '',
    descrizione: '',
    prezzoUnitario: 0,
    livelloRiordino: 0,
    quantitaInRiordino: 0,
    fuoriProduzione: false,
  });

  const [categorie, setCategorie] = useState<string[]>([]);

  const fetchCategorie = async () => {
    const res = await fetch(`${backendUrl}/api/inventario/articoli`, {
      credentials: 'include',
    });
    const data = await res.json();
    const categoriesSet = new Set<string>(data.map((a: any) => a.categoria));
    const distinct: string[] = Array.from(categoriesSet);
    setCategorie(distinct);
  };

  useEffect(() => {
    if (open) fetchCategorie();
  }, [open]);

    useEffect(() => {
    if (!open) return;

    if (articolo) {
      setForm({
        nome: articolo.nome,
        categoria: articolo.categoria,
        descrizione: articolo.descrizione,
        prezzoUnitario: articolo.prezzoUnitario,
        livelloRiordino: articolo.livelloRiordino,
        quantitaInRiordino: articolo.quantitaInRiordino,
        fuoriProduzione: articolo.fuoriProduzione,
        quantitaMagazzino: articolo.quantitaMagazzino,
      });
    } else {
      setForm({
        nome: '',
        categoria: '',
        descrizione: '',
        prezzoUnitario: 0,
        livelloRiordino: 0,
        quantitaInRiordino: 0,
        fuoriProduzione: false,
      });
    }
  }, [open, articolo]);


  const handleSubmit = async () => {
    const method = articolo ? 'PUT' : 'POST';
    const url = articolo
      ? `${backendUrl}/api/inventario/articoli/${articolo.id}`
      : `${backendUrl}/api/inventario/articoli`;

    const payload: any = {
      ...form,
      magazzino: { id: magazzinoId },
    };

    // se sto modificando, NON devo perdere la quantità in magazzino
    if (articolo && typeof articolo.quantitaMagazzino === 'number') {
      payload.quantitaMagazzino = articolo.quantitaMagazzino;
    }

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    onClose();
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{articolo ? 'Modifica Articolo' : 'Nuovo Articolo'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          label="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          fullWidth
          size="small"
        />

        <Autocomplete
          freeSolo
          options={categorie}
          value={form.categoria}
          onChange={(_, value) =>
            setForm({ ...form, categoria: value ?? '' })
          }
          onInputChange={(_, value) =>
            setForm({ ...form, categoria: value })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Categoria"
              size="small"
              fullWidth
            />
          )}
        />

        <TextField
          label="Descrizione"
          multiline
          minRows={2}
          value={form.descrizione}
          onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
          fullWidth
          size="small"
        />

        <TextField
          label="Prezzo Unitario"
          type="number"
          value={form.prezzoUnitario}
          onChange={(e) =>
            setForm({ ...form, prezzoUnitario: parseFloat(e.target.value) || 0 })
          }
          size="small"
        />

        <TextField
          label="Livello Riordino"
          type="number"
          value={form.livelloRiordino}
          onChange={(e) =>
            setForm({ ...form, livelloRiordino: parseFloat(e.target.value) || 0 })
          }
          size="small"
        />

        <TextField
          label="Quantità in Riordino"
          type="number"
          value={form.quantitaInRiordino}
          onChange={(e) =>
            setForm({ ...form, quantitaInRiordino: parseFloat(e.target.value) || 0 })
          }
          size="small"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArticoloFormModal;
