import type { RuntimeMode } from '../types'
import { env } from './env'

export const runtimeMode: RuntimeMode = env.runtimeMode === 'auto' ? 'remote' : env.runtimeMode

export const isMockMode = runtimeMode === 'mock'
