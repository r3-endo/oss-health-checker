import { useState } from "react";

export const RepositoryRegisterForm = ({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (input: { url: string }) => void;
  isSubmitting: boolean;
}) => {
  const [url, setUrl] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ url });
      }}
    >
      <input
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://github.com/owner/repository"
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add"}
      </button>
    </form>
  );
};
