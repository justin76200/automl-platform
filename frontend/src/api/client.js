import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Datasets ─────────────────────────────────────────────────────────────────
export const datasetsApi = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/datasets/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list:    ()         => api.get('/datasets/'),
  preview: (id, rows) => api.get(`/datasets/${id}/preview`, { params: { rows } }),
  delete:  (id)       => api.delete(`/datasets/${id}`),
}

// ── Pipelines ─────────────────────────────────────────────────────────────────
export const pipelinesApi = {
  nodes:  ()         => api.get('/pipelines/nodes'),
  list:   ()         => api.get('/pipelines/'),
  get:    (id)       => api.get(`/pipelines/${id}`),
  create: (body)     => api.post('/pipelines/', body),
  update: (id, body) => api.put(`/pipelines/${id}`, body),
  delete: (id)       => api.delete(`/pipelines/${id}`),
}

// ── Experiments ───────────────────────────────────────────────────────────────
export const experimentsApi = {
  run:  (pipelineId) => api.post(`/experiments/run/${pipelineId}`),
  list: ()           => api.get('/experiments/'),
  get:  (id)         => api.get(`/experiments/${id}`),
}

// ── WebSocket factory ─────────────────────────────────────────────────────────
export const createExperimentSocket = (experimentId) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const base = `${protocol}://${window.location.host}`
  return new WebSocket(`${base}/api/experiments/ws/${experimentId}`)
}

export default api
