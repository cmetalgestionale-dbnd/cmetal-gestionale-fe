'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import { Box, Grid, Typography } from '@mui/material';

import MagazzinoSelector from '@/app/(DashboardLayout)/components/magazzino/MagazzinoSelector';
import InventarioList from '@/app/(DashboardLayout)/components/magazzino/InventarioList';

const MagazzinoPage = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMagazzinoId, setSelectedMagazzinoId] = useState<number | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    async function fetchUserRole() {
      try {
        const res = await fetch(`${backendUrl}/auth/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setRole(data.role);
        } else {
          window.location.href = '/authentication/login';
        }
      } catch {
        window.location.href = '/authentication/login';
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <PageContainer title="Magazzino" description="">
        <Box>Caricamento...</Box>
      </PageContainer>
    );
  }

  if (role !== 'ADMIN' && role !== 'SUPERVISORE') {
    return (
      <PageContainer title="Accesso Negato" description="">
        <Box p={2}>
          <Typography variant="h6" color="error">
            Non hai i permessi per visualizzare questa pagina.
          </Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Gestione Magazzino" description="Gestione Magazzino">
      <Grid container spacing={3}>
        <Grid>
          <MagazzinoSelector onSelect={setSelectedMagazzinoId} />
        </Grid>

{selectedMagazzinoId && (
  <Grid>
    <InventarioList
      key={selectedMagazzinoId}
      magazzinoId={selectedMagazzinoId}
    />
  </Grid>
)}

      </Grid>
    </PageContainer>
  );
};

export default MagazzinoPage;
