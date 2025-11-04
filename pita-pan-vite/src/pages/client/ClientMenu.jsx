import Menu from '../Menu'

export default function ClientMenu(){
  // En el portal del cliente, ya hay un Navbar externo en ClientLayout
  // y debe mostrarse el carrito y acciones completas
  return <Menu showNavbar={false} />
}
