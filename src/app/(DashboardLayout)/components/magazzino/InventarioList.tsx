'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Edit, Delete, History, Add } from '@mui/icons-material';

import { useWS } from '@/app/(DashboardLayout)/ws/WSContext';
import { IMessage } from '@stomp/stompjs';

import MovimentiModal from './MovimentiModal';
import ArticoloFormModal from './ArticoloFormModal';
import MovimentoFormModal from './MovimentoFormModal';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Articolo {
  id: number;
  nome: string;
  categoria: string;
  descrizione?: string;
  prezzoUnitario: number;
  quantitaMagazzino: number;
  valoreInventario: number;
  livelloRiordino: number;
  quantitaInRiordino: number;
  fuoriProduzione: boolean;
  magazzino: { id: number; nome: string };
}

const InventarioList = ({ magazzinoId }: { magazzinoId: number }) => {
  const [articoli, setArticoli] = useState<Articolo[]>([]);
  const [selectedArticolo, setSelectedArticolo] = useState<Articolo | null>(null);

  const [openMovimenti, setOpenMovimenti] = useState(false);
  const [openArticoloForm, setOpenArticoloForm] = useState(false);
  const [openMovimentoForm, setOpenMovimentoForm] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [articoloToDelete, setArticoloToDelete] = useState<Articolo | null>(null);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');



  const { subscribe } = useWS();

const fetchArticoli = async () => {
  const res = await fetch(`${backendUrl}/api/inventario/articoli`, { credentials: 'include' });
  const data: Articolo[] = await res.json();

  const filtrati = data
    .filter((a) => a.magazzino.id === magazzinoId)
    .sort((a, b) => a.id - b.id);  // 👈 sempre per ID crescente

  let ordinati = [...filtrati];

if (sortField) {
  ordinati.sort((a, b) => {
    const valA = (a as any)[sortField];
    const valB = (b as any)[sortField];

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

setArticoli(ordinati);

};


  useEffect(() => {
    fetchArticoli();
  }, [magazzinoId]);

  // WS refresh
  useEffect(() => {
    const unsubscribe = subscribe((msg: IMessage) => {
      try {
        const payload = JSON.parse(msg.body);
        if (payload.tipo === 'REFRESH' || payload.tipoEvento === 'REFRESH') {
          fetchArticoli();
        }
      } catch {}
    });
    return () => unsubscribe();
  }, [subscribe]);

  useEffect(() => {
  // Applica l’ordinamento ogni volta che cambia sortField o sortDirection
  setArticoli((prev) => {
    const copia = [...prev];
    if (!sortField) return copia;

    return copia.sort((a, b) => {
      const valA = (a as any)[sortField];
      const valB = (b as any)[sortField];

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  });
}, [sortField, sortDirection]);


const handleDeleteClick = (articolo: Articolo) => {
  setArticoloToDelete(articolo);
  setConfirmDeleteOpen(true);
};

const handleConfirmDelete = async () => {
  if (!articoloToDelete) return;
  await fetch(`${backendUrl}/api/inventario/articoli/${articoloToDelete.id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  setConfirmDeleteOpen(false);
  setArticoloToDelete(null);
  fetchArticoli();
};

const handleCancelDelete = () => {
  setConfirmDeleteOpen(false);
  setArticoloToDelete(null);
};

const handleSort = (field: string) => {
  if (sortField === field) {
    // toggle asc <-> desc
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    setSortField(field);
    setSortDirection('asc');
  }
};



  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" mb={3} fontWeight={600}>
        Inventario
      </Typography>

      <Box display="flex" gap={2} mb={2}>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="small"
          onClick={() => {
            setSelectedArticolo(null);
            setOpenArticoloForm(true);
          }}
        >
          Nuovo Articolo
        </Button>

        <Button
          variant="outlined"
          startIcon={<History />}
          size="small"
          onClick={() => {
            setSelectedArticolo(null);
            setOpenMovimenti(true);
          }}
        >
          Storico magazzino
        </Button>
      </Box>

      <Table size="small">
        <TableHead>
  <TableRow>
    <TableCell onClick={() => handleSort('nome')} sx={{ cursor: 'pointer' }}>
      Nome {sortField === 'nome' && (sortDirection === 'asc' ? '▲' : '▼')}
    </TableCell>

    <TableCell onClick={() => handleSort('categoria')} sx={{ cursor: 'pointer' }}>
      Categoria {sortField === 'categoria' && (sortDirection === 'asc' ? '▲' : '▼')}
    </TableCell>

    <TableCell onClick={() => handleSort('quantitaMagazzino')} sx={{ cursor: 'pointer' }}>
      Quantità {sortField === 'quantitaMagazzino' && (sortDirection === 'asc' ? '▲' : '▼')}
    </TableCell>

    <TableCell onClick={() => handleSort('prezzoUnitario')} sx={{ cursor: 'pointer' }}>
      Prezzo {sortField === 'prezzoUnitario' && (sortDirection === 'asc' ? '▲' : '▼')}
    </TableCell>

    <TableCell onClick={() => handleSort('valoreInventario')} sx={{ cursor: 'pointer' }}>
      Valore inventario {sortField === 'valoreInventario' && (sortDirection === 'asc' ? '▲' : '▼')}
    </TableCell>

    <TableCell onClick={() => handleSort('livelloRiordino')} sx={{ cursor: 'pointer' }}>
      Livello riordino {sortField === 'livelloRiordino' && (sortDirection === 'asc' ? '▲' : '▼')}
    </TableCell>

    <TableCell onClick={() => handleSort('quantitaInRiordino')} sx={{ cursor: 'pointer' }}>
      Quantità in riordino {sortField === 'quantitaInRiordino' && (sortDirection === 'asc' ? '▲' : '▼')}
    </TableCell>

    <TableCell>Azioni</TableCell>
  </TableRow>
</TableHead>

<TableBody>
  {articoli.map((articolo) => {
    const sottoScorta =
      typeof articolo.livelloRiordino === 'number' &&
      articolo.livelloRiordino > 0 &&
      articolo.quantitaMagazzino < articolo.livelloRiordino;

    return (
      <TableRow
        key={articolo.id}
        sx={
          sottoScorta
            ? { backgroundColor: 'rgba(255, 193, 7, 0.2)' } // giallino warning
            : undefined
        }
      >
        <TableCell>{articolo.nome}</TableCell>
        <TableCell>{articolo.categoria}</TableCell>
        <TableCell>{articolo.quantitaMagazzino}</TableCell>
        <TableCell>{articolo.prezzoUnitario} €</TableCell>
        <TableCell>{articolo.valoreInventario} €</TableCell>
        <TableCell>{articolo.livelloRiordino}</TableCell>
        <TableCell>{articolo.quantitaInRiordino}</TableCell>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedArticolo(articolo);
              setOpenMovimenti(true);
            }}
          >
            <History fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedArticolo(articolo);
              setOpenMovimentoForm(true);
            }}
          >
            ➕➖
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedArticolo(articolo);
              setOpenArticoloForm(true);
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
<IconButton size="small" onClick={() => handleDeleteClick(articolo)}>
  <Delete fontSize="small" />
</IconButton>

        </TableCell>
      </TableRow>
    );
  })}
</TableBody>

      </Table>

      {/* Modali */}
      <MovimentiModal
        open={openMovimenti}
        onClose={() => setOpenMovimenti(false)}
        articolo={selectedArticolo}
        magazzinoId={magazzinoId}
      />

      <ArticoloFormModal
        open={openArticoloForm}
        onClose={() => setOpenArticoloForm(false)}
        articolo={selectedArticolo}
        magazzinoId={magazzinoId}
        onSaved={fetchArticoli}
      />

      {selectedArticolo && (
        <MovimentoFormModal
          open={openMovimentoForm}
          onClose={() => setOpenMovimentoForm(false)}
          articolo={selectedArticolo}
          onSaved={fetchArticoli}
        />
      )}
      {/* Dialog conferma eliminazione articolo */}
<Dialog
  open={confirmDeleteOpen}
  onClose={handleCancelDelete}
>
  <DialogTitle>Conferma Eliminazione</DialogTitle>
  <DialogContent>
    <Typography>
      Sei sicuro di voler eliminare l&apos;articolo{' '}
      <strong>{articoloToDelete?.nome}</strong>?
      <br />
      Verranno eliminati anche tutti i movimenti collegati.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCancelDelete}>Annulla</Button>
    <Button color="error" variant="contained" onClick={handleConfirmDelete}>
      Elimina
    </Button>
  </DialogActions>
</Dialog>

    </Paper>
  );
};

export default InventarioList;
