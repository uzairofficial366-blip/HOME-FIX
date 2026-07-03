import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/providers')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/providers"!</div>
}
