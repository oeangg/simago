import {
  BookOpen,
  Bot,
  Box,
  Frame,
  LucideIcon,
  Settings2,
  ShieldUser,
  SquareTerminal,
  Truck,
} from "lucide-react";

export interface SubSidebarItem {
  title: string;
  url: string;
}
export interface SidebarItem {
  url?: string;
  title: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: SubSidebarItem[];
  roles?: string[];
}

export interface sidebarData {
  sidebar: SidebarItem[];
}

export const data: sidebarData = {
  sidebar: [
    {
      title: "Data Master",
      icon: SquareTerminal,
      isActive: true,
      url: "#",
      roles: ["USER", "SUPERVISOR", "MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Daftar Customer",
          url: "/dashboard/customer",
        },
        {
          title: "Daftar Material",
          url: "/dashboard/material",
        },

        {
          title: "Daftar Supplier",
          url: "/dashboard/supplier",
        },
        {
          title: "Daftar Karyawan",
          url: "/dashboard/karyawan",
        },
        {
          title: "Daftar Vendor",
          url: "/dashboard/vendor",
        },
        {
          title: "Daftar Driver",
          url: "/dashboard/driver",
        },
        {
          title: "Daftar Kendaraan",
          url: "/dashboard/kendaraan",
        },
      ],
    },
    {
      title: "Marketing",
      icon: Bot,
      url: "#",
      roles: ["USER", "SUPERVISOR", "MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Data Marketing satu",
          url: "#",
        },
        {
          title: "Data Marketing dua",
          url: "#",
        },
        {
          title: "Data Marketing tiga",
          url: "#",
        },
        {
          title: "Data Marketing empat",
          url: "#",
        },
        {
          title: "Data Marketing lima",
          url: "#",
        },
      ],
    },
    {
      title: "Data Finance",
      icon: BookOpen,
      url: "#",
      roles: ["USER", "SUPERVISOR", "MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Data finance satu",
          url: "#",
        },
        {
          title: "Data finance dua",
          url: "#",
        },
        {
          title: "Data finance tiga",
          url: "#",
        },
        {
          title: "Data finance empat",
          url: "#",
        },
      ],
    },
    {
      title: "Data Pengiriman",
      icon: Truck,
      url: "#",
      roles: ["USER", "SUPERVISOR", "MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Data Pengiriman satu",
          url: "#",
        },
        {
          title: "Data Pengiriman dua",
          url: "#",
        },
        {
          title: "Data Pengiriman tiga",
          url: "#",
        },
      ],
    },
    {
      title: "Laporan",
      icon: Frame,
      url: "#",
      roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Laporan satu",
          url: "#",
        },
        {
          title: "Laporan dua",
          url: "#",
        },
        {
          title: "Laporan tiga",
          url: "#",
        },
        {
          title: "Laporan empat",
          url: "#",
        },
      ],
    },
    {
      title: "Warehouse",
      icon: Box,
      url: "#",
      roles: ["MANAGER", "ADMIN", "SUPER_ADMIN"],
      items: [
        {
          title: "Pembelian Material",
          url: "/dashboard/pembelian-material",
        },
        {
          title: "Pengeluaran Material",
          url: "#",
        },
      ],
    },

    {
      title: "Pengaturan",
      icon: Settings2,
      url: "#",
      roles: ["SUPER_ADMIN", "ADMIN"],
      items: [
        {
          title: "Data Negara",
          url: "/dashboard/negara",
        },
        {
          title: "Data Wilayah kota",
          url: "/dashboard/wilayah",
        },
      ],
    },
    {
      title: "Manajemen User",
      icon: ShieldUser,
      url: "#",
      roles: ["SUPER_ADMIN"],
      items: [
        {
          title: "Daftar User",
          url: "/dashboard/manuser",
        },
      ],
    },
  ],
};
