import { defineConfig } from 'vite'
import type { PluginOption, PreviewServer, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

const pipelineStages = [
  { id: 1, stage: 'Prospecção', leads: 12 },
  { id: 2, stage: 'Qualificação', leads: 8 },
  { id: 3, stage: 'Proposta Enviada', leads: 5 },
  { id: 4, stage: 'Negociação', leads: 3 },
  { id: 5, stage: 'Fechado (Ganho)', leads: 2 },
  { id: 6, stage: 'Fechado (Perdido)', leads: 1 },
]

const pipelineMockPlugin = (): PluginOption => ({
  name: 'pipeline-mock-endpoint',
  configureServer(server: ViteDevServer) {
    server.middlewares.use((req, res, next) => {
      if (req.method === 'GET' && req.url === '/api/pipeline/stages') {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true, data: pipelineStages }))
        return
      }
      next()
    })
  },
  configurePreviewServer(server: PreviewServer) {
    server.middlewares.use((req, res, next) => {
      if (req.method === 'GET' && req.url === '/api/pipeline/stages') {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ success: true, data: pipelineStages }))
        return
      }
      next()
    })
  }
})

export default defineConfig({
  plugins: [react(), pipelineMockPlugin()],
  server: { port: 5173 }
})