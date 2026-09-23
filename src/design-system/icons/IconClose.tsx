import { IconBase, type IconProps } from './IconBase'

/** Figma `Icon/close` */
export function IconClose(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 4L12 12M12 4L4 12" />
    </IconBase>
  )
}
