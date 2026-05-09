import { signUp } from '../login/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function SignUpPage(
  props: {
    searchParams: Promise<{ message: string }>
  }
) {
  const searchParams = await props.searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center px-4 bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            Cadastre-se para começar a controlar suas despesas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" action={signUp}>
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
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {searchParams?.message && (
              <p className="text-sm text-red-500 text-center">
                {searchParams.message}
              </p>
            )}
            <Button type="submit" className="w-full">
              Cadastrar
            </Button>
            <div className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="underline">
                Fazer login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}