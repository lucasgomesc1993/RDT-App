import { login } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default async function LoginPage(
  props: {
    searchParams: Promise<{ message: string; error?: string; error_description?: string }>
  }
) {
  const searchParams = await props.searchParams
  const message = searchParams?.message || searchParams?.error_description

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Elementos decorativos de fundo sutis */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-white/[0.02] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-4">
            <div className="h-4 w-4 bg-foreground rounded-[1px] rotate-45 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Bem-vindo de volta</h1>
          <p className="text-muted-foreground text-sm font-medium opacity-60 px-8">Acesse sua conta para gerenciar suas despesas com precisão.</p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8 shadow-sm">
          <form className="grid gap-6" action={login}>
            <div className="grid gap-2.5">
              <Label htmlFor="email" className="ml-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">E-mail Corporativo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nome@empresa.com"
                required
                className="h-11 bg-white/[0.02] border-white/[0.06] focus-visible:bg-white/[0.04] rounded-xl"
              />
            </div>
            <div className="grid gap-2.5">
              <div className="flex items-center justify-between px-1">
                <Label htmlFor="password" title="password" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Senha</Label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  Recuperar Senha
                </Link>
              </div>
              <Input id="password" name="password" type="password" required className="h-11 bg-white/[0.02] border-white/[0.06] focus-visible:bg-white/[0.04] rounded-xl" />
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-medium border ${searchParams.error ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-foreground/5 border-white/10 text-muted-foreground'} animate-in fade-in zoom-in-95`}>
                {message}
              </div>
            )}

            <Button type="submit" className="w-full h-11 bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all rounded-xl font-semibold uppercase tracking-wider text-xs">
              Entrar no Sistema
            </Button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium opacity-40">
            Não possui acesso?{" "}
            <Link href="/signup" className="text-foreground hover:opacity-80 transition-opacity font-semibold">
              Solicitar Cadastro
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}