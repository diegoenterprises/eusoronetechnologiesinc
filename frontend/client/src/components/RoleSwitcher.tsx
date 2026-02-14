/**
 * ROLE SWITCHER DROPDOWN
 * 
 * Single button that reveals dropdown menu with all 10 test user accounts
 * Click any account to instantly switch to that role's dashboard
 * 
 * ONLY FOR DEVELOPMENT/TESTING
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  Users,
  User,
  Flame,
  Shield,
  Building2,
  FileCheck,
  AlertTriangle,
  Crown,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

const TEST_ACCOUNTS = [
  {
    role: "SHIPPER",
    name: "Sarah Martinez",
    email: "sarah.martinez@petrochemical.com",
    icon: Package,
    color: "text-blue-500",
  },
  {
    role: "CATALYST",
    name: "Mike Johnson",
    email: "mike.johnson@swiftlogistics.com",
    icon: Truck,
    color: "text-green-500",
  },
  {
    role: "BROKER",
    name: "Jennifer Chen",
    email: "jennifer.chen@globalbrokers.com",
    icon: Users,
    color: "text-purple-500",
  },
  {
    role: "DRIVER",
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@driver.com",
    icon: User,
    color: "text-orange-500",
  },
  {
    role: "DISPATCH",
    name: "David Thompson",
    email: "david.thompson@dispatch.com",
    icon: Flame,
    color: "text-red-500",
  },
  {
    role: "ESCORT",
    name: "Amanda Williams",
    email: "amanda.williams@escort.com",
    icon: Shield,
    color: "text-yellow-500",
  },
  {
    role: "TERMINAL_MANAGER",
    name: "Robert Davis",
    email: "robert.davis@terminal.com",
    icon: Building2,
    color: "text-cyan-500",
  },
  {
    role: "COMPLIANCE_OFFICER",
    name: "Lisa Anderson",
    email: "lisa.anderson@compliance.com",
    icon: FileCheck,
    color: "text-indigo-500",
  },
  {
    role: "SAFETY_MANAGER",
    name: "James Wilson",
    email: "james.wilson@safety.com",
    icon: AlertTriangle,
    color: "text-pink-500",
  },
  {
    role: "ADMIN",
    name: "Admin User",
    email: "admin@eusotrip.com",
    icon: Crown,
    color: "text-purple-600",
  },
];

export function RoleSwitcher() {
  const [currentRole, setCurrentRole] = useState<string | null>(() => {
    return localStorage.getItem("test_role");
  });

  const handleRoleSelect = (account: typeof TEST_ACCOUNTS[0]) => {
    // Store test user data
    localStorage.setItem("test_role", account.role);
    localStorage.setItem("test_user", JSON.stringify({
      id: Math.floor(Math.random() * 1000),
      openId: `test_${account.role.toLowerCase()}_${Date.now()}`,
      name: account.name,
      email: account.email,
      role: account.role,
      isActive: true,
      isVerified: true,
    }));
    
    setCurrentRole(account.role);
    
    // Reload to apply new role
    window.location.reload();
  };

  const handleReset = () => {
    localStorage.removeItem("test_role");
    localStorage.removeItem("test_user");
    setCurrentRole(null);
    window.location.reload();
  };

  const currentAccount = TEST_ACCOUNTS.find(acc => acc.role === currentRole);

  return (
    <div className="flex items-center gap-2">
      {currentRole && (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Testing: {currentAccount?.name}
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <User className="h-4 w-4" />
            Test Accounts
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[300px]">
          <DropdownMenuLabel>Switch Test Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {TEST_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isActive = currentRole === account.role;
            
            return (
              <DropdownMenuItem
                key={account.role}
                onClick={() => handleRoleSelect(account)}
                className={`cursor-pointer ${isActive ? 'bg-blue-500/10' : ''}`}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`h-4 w-4 ${account.color}`} />
                  <div className="flex-1">
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.role}</div>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
          
          {currentRole && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReset} className="cursor-pointer text-red-500">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Real Account
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

