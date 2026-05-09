import { forgotPassword } from '../login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function ForgotPasswordPage(
  props: {
    searchParams: Promise<{ message: string }>
  }
) {
  const searchParams = await props.searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            Enviaremos um link de recuperação para o seu e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" action={forgotPassword}>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nome@empresa.com"
                required
              />
            </div>
            {searchParams?.message && (
              <p className="text-sm text-blue-500 text-center">
                {searchParams.message}
              </p>
            )}
            <Button type="submit" className="w-full">
              Enviar Link
            </Button>
            <div className="text-center text-sm">
              <Link href="/login" className="underline">
                Voltar para o login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}