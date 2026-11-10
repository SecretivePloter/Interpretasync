// ID master placeholder yang diverifikasi di database production.
export const UNASSIGNED_INTERPRETER_ID = '6d846630-b7a3-4f17-9399-524b407166ae'

export function isUnassignedInterpreter(event, interpreter) {
  if (event.interpreter_id == null || event.interpreter_id === UNASSIGNED_INTERPRETER_ID) return true
  // Profil belum dimuat bukan berarti interpreter belum ditentukan.
  return interpreter?.name?.normalize('NFKC').trim().toLocaleLowerCase('id-ID') === 'belum ditentukan'
}
