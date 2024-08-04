import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function FormCard({ children, title, description }: { children: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border border-yellow-300 rounded-lg mb-6 p-6">
      <CardHeader className="mb-4">
        <CardTitle className="text-xl font-semibold mb-2">{title}</CardTitle>
        <CardDescription className="text-gray-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

export default FormCard