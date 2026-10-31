import { redirect } from "next/navigation";

// L'ancienne adresse du questionnaire « save the date » : il n'y a plus qu'un
// seul formulaire. Les liens déjà envoyés continuent de fonctionner.
export default async function SaveTheDateRedirect({ params }) {
  const { token } = await params;
  redirect(`/i/${token}/rsvp`);
}
