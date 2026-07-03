import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/verifications')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/verifications"!</div>
}
