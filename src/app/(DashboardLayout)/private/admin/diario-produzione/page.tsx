'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DiarioProduzioneComponent from '@/app/(DashboardLayout)/components/diario/DiarioProduzioneComponent';

const DiarioProduzionePage = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      <PageContainer title="Caricamento..." description="">
        <Box>Caricamento...</Box>
      </PageContainer>
    );
  }

  if (!['ADMIN', 'SUPERVISORE', 'DIPENDENTE'].includes(role || '')) {
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
    <PageContainer title="Diario Produzione" description="Diario Produzione">
      <Box sx={{ width: '100%', minWidth: 0 }}>
        <DiarioProduzioneComponent />
      </Box>
    </PageContainer>
  );
};

export default DiarioProduzionePage;
