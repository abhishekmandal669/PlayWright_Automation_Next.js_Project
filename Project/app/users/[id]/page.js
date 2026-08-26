import UserEditClient from './UserEditClient';

export default function UserEditPage({ params }) {
  return <UserEditClient userId={params.id} />;
}
