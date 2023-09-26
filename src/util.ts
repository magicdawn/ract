import { trim } from 'lodash-es'

export function getName(str: string) {
  return trim(str, ' "\'')
}
