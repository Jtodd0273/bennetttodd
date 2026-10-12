import PatientForm from "../PatientForm";

export const metadata = { title: "Add a patient | Staff" };

export default function NewPatient() {
  return (
    <>
      <h1 className="mt-8 font-display text-3xl font-bold">Add a patient</h1>
      <PatientForm />
    </>
  );
}
