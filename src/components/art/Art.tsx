import type { ComponentType } from 'react'
import type { EmblemId, SceneId } from '@/lib/art'
import {
  ArrivalAtVoid,
  BeamPiercing,
  BrokenVault,
  Circuit,
  ClosedLoop,
  Contemplation,
  Dynamo,
  GuardianEye,
  LightColumn,
  Staircase,
  TheOnlyOne,
  TombstoneField,
  TwinMoons,
  VerticalVoid,
  Vigil,
  Window,
  type ArtProps,
} from './generated'

// ─────────────────────────────────────────────────────────────────────────────
// Cena e emblema por id (src/lib/art.ts). Server components: só a obra usada
// vira HTML; nenhum JavaScript chega ao cliente. aria-hidden vem do SVG
// gerado — a arte é decoração, o conteúdo da página não depende dela.
// ─────────────────────────────────────────────────────────────────────────────

export const SCENES: Record<SceneId, ComponentType<ArtProps>> = {
  'beam-piercing': BeamPiercing,
  'broken-vault': BrokenVault,
  'light-column': LightColumn,
  'twin-moons': TwinMoons,
  'arrival-at-void': ArrivalAtVoid,
  'vertical-void': VerticalVoid,
  contemplation: Contemplation,
  'the-only-one': TheOnlyOne,
  window: Window,
  'guardian-eye': GuardianEye,
  vigil: Vigil,
  'tombstone-field': TombstoneField,
}

const EMBLEMS: Record<EmblemId, ComponentType<ArtProps>> = {
  staircase: Staircase,
  dynamo: Dynamo,
  circuit: Circuit,
  'closed-loop': ClosedLoop,
}

/** Cena 360×280. A largura vem de `className`; a altura segue o viewBox. */
export function Scene({ id, className = '' }: { id: SceneId; className?: string }) {
  const Art = SCENES[id]
  return <Art className={`art-scene block h-auto ${className}`} />
}

/** Emblema 96×96. */
export function Emblem({ id, className = '' }: { id: EmblemId; className?: string }) {
  const Art = EMBLEMS[id]
  return <Art className={`art-emblem block ${className}`} />
}
