import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function LoginPage(
  props: {
    searchParams: Promise<{ message: string; error?: string; error_description?: string }>
  }
) {
  const searchParams = await props.searchParams
  const message = searchParams?.message || searchParams?.error_description

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Insira seu e-mail e senha para acessar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" action={login}>
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
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  href="/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            {message && (
              <div className={`p-3 rounded-md text-sm text-center ${searchParams.error ? 'bg-red-500/15 text-red-500' : 'bg-blue-500/15 text-blue-500'}`}>
                {message}
              </div>
            )}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{" "}
              <Link href="/signup" className="underline">
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}