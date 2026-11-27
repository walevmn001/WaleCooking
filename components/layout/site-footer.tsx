import { Link } from "@/components/ui/link";
import { Container } from "./container";
import { SiteLogo } from "./site-logo";
import { siteConfig } from "@/lib/constants/site";
import { footerNavGroups, footerPolicyLinks } from "@/lib/constants/navigation";

/**
 * SiteFooter — chân trang. Chỉ hiển thị thông tin liên hệ khi ĐÃ có cấu hình thật
 * (site.contact); không bịa địa chỉ/email/số điện thoại/pháp lý.
 */
export function SiteFooter() {
  const { email, phone, address } = siteConfig.contact;
  const hasContact = Boolean(email || phone || address);

  return (
    <footer role="contentinfo" className="mt-16 border-t border-line-subtle bg-surface-muted">
      <Container size="wide" className="flex flex-col gap-8 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-3">
            <SiteLogo variant="full" />
            <p className="max-w-xs text-body-sm text-ink-muted">{siteConfig.description}</p>
          </div>

          {footerNavGroups.map((group) => (
            <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3">
              <h2 className="text-label text-ink">{group.title}</h2>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <li key={`${group.title}-${item.href}`}>
                    <Link
                      href={item.href}
                      appearance="unstyled"
                      className="text-body-sm text-ink-muted underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:focus-ring rounded-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {hasContact ? (
          <div className="flex flex-col gap-2 border-t border-line-subtle pt-6">
            <h2 className="text-label text-ink">Liên hệ</h2>
            <ul className="flex flex-col gap-1 text-body-sm text-ink-muted">
              {email ? (
                <li>
                  Email:{" "}
                  <a className="underline underline-offset-4 hover:text-primary" href={`mailto:${email}`}>
                    {email}
                  </a>
                </li>
              ) : null}
              {phone ? <li>Điện thoại: {phone}</li> : null}
              {address ? <li>Địa chỉ: {address}</li> : null}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-line-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm text-ink-muted">
            © {siteConfig.copyrightYear} {siteConfig.name}. Bảo lưu mọi quyền.
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {footerPolicyLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  appearance="unstyled"
                  className="text-body-sm text-ink-subtle underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:focus-ring rounded-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
