import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { User, Mail, Phone, MapPin, Edit2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <Button variant="outline" className="gap-2">
          <Edit2 className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{user?.name || "User"}</h2>
          <p className="text-purple-400 font-medium">{user?.role || "USER"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
