'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Switch,
  TextField,
  Button,
  TableContainer,
} from '@mui/material';
import { Add, Remove, Save } from '@mui/icons-material';

interface Impostazione {
  chiave: string;
  valore: string;
  tipo: 'int' | 'boolean' | 'double' | 'string';
  minValue?: number;
  maxValue?: number;
  descrizione?: string;
}

const keyOrder = [
  'azienda_nome',
  'azienda_indirizzo',
  'azienda_piva',
  'max_commesse_per_dipendente',
  'giorni_retention_assegnazioni',
  'abilita_start_automatica'
];

const SettingsComponent = ({ readOnly = false }: { readOnly?: boolean }) => {
  const [settings, setSettings] = useState<Impostazione[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchSettings = async () => {
    const res = await fetch(`${backendUrl}/api/impostazioni`, { credentials: 'include' });
    const data: Impostazione[] = await res.json();
    data.sort((a, b) => keyOrder.indexOf(a.chiave) - keyOrder.indexOf(b.chiave));
    setSettings(data);
    setEditedValues({});
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (chiave: string, valore: string) => {
    await fetch(`${backendUrl}/api/impostazioni/${chiave}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      credentials: 'include',
      body: valore,
    });
    await fetchSettings();
  };

  const handleToggle = (setting: Impostazione) => {
    const newValue = setting.valore === '1' ? '0' : '1';
    updateSetting(setting.chiave, newValue);
  };

  const handleIncrement = (setting: Impostazione) => {
    if (setting.tipo === 'int' || setting.tipo === 'double') {
      let val = parseFloat(setting.valore) || 0;
      val += 1;
      if (setting.maxValue !== undefined) val = Math.min(val, setting.maxValue);
      updateSetting(setting.chiave, setting.tipo === 'int' ? val.toFixed(0) : val.toFixed(2));
    }
  };

  const handleDecrement = (setting: Impostazione) => {
    if (setting.tipo === 'int' || setting.tipo === 'double') {
      let val = parseFloat(setting.valore) || 0;
      val -= 1;
      if (setting.minValue !== undefined) val = Math.max(val, setting.minValue);
      updateSetting(setting.chiave, setting.tipo === 'int' ? val.toFixed(0) : val.toFixed(2));
    }
  };

  const handleDoubleChange = (setting: Impostazione, newValue: string) => {
    const sanitized = newValue.replace(/[^0-9.]/g, '');
    if (!sanitized) return;
    let val = parseFloat(sanitized);
    if (isNaN(val)) return;
    if (setting.minValue !== undefined) val = Math.max(val, setting.minValue);
    if (setting.maxValue !== undefined) val = Math.min(val, setting.maxValue);
    updateSetting(setting.chiave, val.toFixed(2));
  };

  const handleStringEdit = (chiave: string, valore: string) => {
    setEditedValues((prev) => ({ ...prev, [chiave]: valore }));
  };

  const handleStringSave = (setting: Impostazione) => {
    const nuovoValore = editedValues[setting.chiave];
    if (nuovoValore !== undefined && nuovoValore !== setting.valore) {
      updateSetting(setting.chiave, nuovoValore);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h5" mb={3} fontWeight={600}>
        Impostazioni
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Descrizione</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Valore</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {settings.map((setting) => {
              const edited = editedValues[setting.chiave];
              const showSave =
                setting.tipo === 'string' &&
                edited !== undefined &&
                edited !== setting.valore;

              return (
                <TableRow key={setting.chiave}>
                  <TableCell>{setting.descrizione}</TableCell>
                  <TableCell>
                    {setting.tipo === 'boolean' ? (
                      <Switch
                        checked={setting.valore === '1'}
                        onChange={() => handleToggle(setting)}
                        disabled={readOnly}
                      />
                    ) : setting.tipo === 'string' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          value={edited !== undefined ? edited : setting.valore}
                          size="small"
                          onChange={(e) => handleStringEdit(setting.chiave, e.target.value)}
                          inputProps={{ style: { width: 250 }, readOnly }}
                        />
                        {showSave && !readOnly && (
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => handleStringSave(setting)}
                            startIcon={<Save />}
                          >
                            Salva
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={() => handleDecrement(setting)} disabled={readOnly}>
                          <Remove />
                        </IconButton>
                        <TextField
                          value={setting.valore}
                          size="small"
                          onChange={(e) => {
                            if (setting.tipo === 'double')
                              handleDoubleChange(setting, e.target.value);
                          }}
                          inputProps={{
                            style: { width: 70, textAlign: 'center' },
                            readOnly: readOnly && setting.tipo !== 'double',
                          }}
                        />
                        <IconButton onClick={() => handleIncrement(setting)} disabled={readOnly}>
                          <Add />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default SettingsComponent;
