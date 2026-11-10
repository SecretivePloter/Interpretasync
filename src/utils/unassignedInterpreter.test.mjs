import assert from 'node:assert/strict'
import { isUnassignedInterpreter as check, UNASSIGNED_INTERPRETER_ID as placeholder } from './unassignedInterpreter.js'
assert.equal(check({interpreter_id: placeholder}), true)
assert.equal(check({interpreter_id: null}), true)
assert.equal(check({interpreter_id: 'normal'}, {name: ' Belum Ditentukan '}), true)
assert.equal(check({interpreter_id: 'normal'}, {name: 'Doni'}), false)
assert.equal(check({interpreter_id: 'normal'}), false)
assert.equal(check({interpreter_id: 'normal', title: 'Belum Ditentukan TMMIN'}, {name: 'Doni'}), false)
assert.equal(check({interpreter_id: placeholder, order_id: null}), true)
console.log('7 classification assertions passed')
