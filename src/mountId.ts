/** Standalone page mount (`index.html`). One form per page, slug from the URL. */
export const MOUNT_ID = "roscioli-event-form";

/** Embed mount id. Unique per form so several embeds can share a host page. */
export function embedMountId(slug: string): string {
  return `${MOUNT_ID}-${slug}`;
}
