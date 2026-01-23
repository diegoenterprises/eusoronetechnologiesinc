import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewsFeed() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>News Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">News feed page - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
