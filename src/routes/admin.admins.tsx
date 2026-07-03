import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/admins')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/admins"!</div>
}
