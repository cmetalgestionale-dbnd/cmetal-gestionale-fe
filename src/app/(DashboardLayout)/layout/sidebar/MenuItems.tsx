import {
  IconSettings,
  IconUser,
  IconHammer,
  IconForklift,
  IconNotebook,
  IconTruck
} from "@tabler/icons-react";



import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "HOME",
  },

  {
    id: uniqueId(),
    title: "Diario Produzione",
    icon: IconNotebook,
    href: "/private/admin/diario-produzione",
    roles: ["ADMIN", "SUPERVISORE", "DIPENDENTE"],
  },
  {
    id: uniqueId(),
    title: "Tabella di Marcia",
    icon: IconTruck,
    href: "/private/admin/tabella-marcia",
    roles: ["ADMIN", "SUPERVISORE", "DIPENDENTE"],
  },
  {
    navlabel: true,
    subheader: "GESTIONE",
  },
  {
    id: uniqueId(),
    title: "Gestione Commesse",
    icon: IconHammer,
    href: "/private/admin/commesse",
    roles: ["ADMIN", "SUPERVISORE"],
  },
  {
    id: uniqueId(),
    title: "Gestione Inventario",
    icon: IconForklift,
    href: "/private/admin/magazzino",
    roles: ["ADMIN", "SUPERVISORE"],
  },
  {
    navlabel: true,
    subheader: "AUTENTICAZIONE",
  },
  {
    id: uniqueId(),
    title: "Gestione Utenze",
    icon: IconUser,
    href: "/private/admin/utenze",
    roles: ["ADMIN"],
  },
  {
    navlabel: true,
    subheader: "ALTRO",
  },
  {
    id: uniqueId(),
    title: "Impostazioni",
    icon: IconSettings,
    href: "/private/admin/impostazioni",
    roles: ["ADMIN"],
  },

];

export default Menuitems;
