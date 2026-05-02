import {
  Briefcase,
  Dumbbell,
  Film,
  FolderArchive,
  Heart,
  Home,
  Map,
  Settings,
  ShoppingBag,
  WalletCards
} from "lucide-react";
  
  export const navItems = [
    {
      label: "Home",
      path: "/home",
      icon: Home,
      group: "CORE"
    },
    {
      label: "Expenses",
      path: "/expenses",
      icon: WalletCards,
      group: "CORE"
    },
    {
      label: "Gym",
      path: "/gym",
      icon: Dumbbell,
      group: "CORE"
    },
    {
      label: "Jobs",
      path: "/jobs",
      icon: Briefcase,
      group: "CORE"
    },

    {
      label: "Loot",
      path: "/loot",
      icon: ShoppingBag,
      group: "V2"
    },
    {
      label: "Media",
      path: "/media",
      icon: Film,
      group: "V2"
    },

    {
      label: "Bucket List",
      path: "/bucket-list",
      icon: Heart,
      group: "PERSONAL"
    },
    {
      label: "Places",
      path: "/places",
      icon: Map,
      group: "PERSONAL"
    },
    {
      label: "Library",
      path: "/library",
      icon: FolderArchive,
      group: "CORE"
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
      group: "SYSTEM"
    }
  ];