import React, { useEffect, useState } from "react";
import Menuitems from "./MenuItems";
import { Box, useTheme, GlobalStyles } from "@mui/material";
import {
  Logo,
  Sidebar as MUI_Sidebar,
  Menu,
  MenuItem,
  Submenu,
} from "react-mui-sidebar";
import { IconPoint } from '@tabler/icons-react';
import Link from "next/link";
import { usePathname } from "next/navigation";

const filterMenuItems = (items: any[], role: string | null) => {
  if (!role) return [];

  const visibleItems: any[] = [];
  let pendingSubheader: any = null;

  items.forEach((item) => {
    if (item.subheader) {
      pendingSubheader = item;
      return;
    }

    const isVisible = !item.roles || item.roles.includes(role);
    if (!isVisible) return;

    if (pendingSubheader) {
      visibleItems.push(pendingSubheader);
      pendingSubheader = null;
    }
    visibleItems.push(item);
  });

  return visibleItems;
};

const renderMenuItems = (items: any, pathDirect: any, theme: any) => {
  return items.map((item: any) => {
    const Icon = item.icon ? item.icon : IconPoint;
const itemIcon = <Icon stroke={1.5} size="1.3rem" color={theme.palette.text.primary} />;


    if (item.subheader) {
      return <Menu subHeading={item.subheader} key={item.subheader} />;
    }

    if (item.children) {
      return (
        <Submenu
          key={item.id}
          title={item.title}
          icon={itemIcon}
          borderRadius="7px"
        >
          {renderMenuItems(item.children, pathDirect, theme)}
        </Submenu>
      );
    }

    return (
      <Box px={3} key={item.id}>
        <MenuItem
          key={item.id}
          isSelected={pathDirect === item?.href}
          borderRadius="8px"
          icon={itemIcon}
          link={item.href}
          component={Link}
        >
          {item.title}
        </MenuItem>
      </Box>
    );
  });
};

const SidebarItems = () => {
  const pathname = usePathname();
  const pathDirect = pathname;
  const theme = useTheme();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, { credentials: 'include' });
      if (!res.ok) return;
      const user = await res.json();
      setRole(user.role);
    };
    fetchRole();
  }, []);

  const visibleMenuItems = filterMenuItems(Menuitems, role);

  return (
    <>
      {/* Global Styles per sidebar: testo e icone bianchi */}
      <GlobalStyles
        styles={{
          '.MuiListItemButton-root': {
            color: theme.palette.text.primary,
          },
          '.MuiListItemIcon-root': {
            color: theme.palette.text.primary,
          },
          '.MuiListItemText-root': {
            color: theme.palette.text.primary,
          },
          '.MuiTypography-root': {
            color: theme.palette.text.primary,
          },
          '.MuiListSubheader-root, .MuiListSubheader-gutters, .MuiListSubheader-sticky': {
            color: theme.palette.text.primary + ' !important',
          },
        }}
      />



      <MUI_Sidebar
        width="100%"
        showProfile={false}
        themeColor={theme.palette.primary.main}
        themeSecondaryColor={theme.palette.secondary.main}
      >
        <Logo
          img="/images/logos/logo_transparent.png"
          component={Link}
          href="/private/admin/diario-produzione"
        />
        {renderMenuItems(visibleMenuItems, pathDirect, theme)}
      </MUI_Sidebar>
    </>
  );
};

export default SidebarItems;
