import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/jobs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/jobs"!</div>
}
