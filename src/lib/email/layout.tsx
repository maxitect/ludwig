import "server-only";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";
import type { ReactNode } from "react";
import { EMAIL_COLOURS } from "./tokens";

const { paper, ink, crayon } = EMAIL_COLOURS;

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px",
          backgroundColor: paper,
          color: ink,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <Container style={{ maxWidth: "480px", margin: "0 auto" }}>
          <Text
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              letterSpacing: "0.04em",
              margin: "0 0 24px",
            }}
          >
            LUDWIG.
          </Text>
          {children}
          <Text style={{ fontSize: "16px", marginTop: "24px" }}>Ludwig</Text>
          <Text style={{ fontSize: "12px", color: crayon, marginTop: "32px" }}>
            Unofficial fan site, not affiliated with the BBC.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: "16px", lineHeight: 1.5 }}>{children}</Text>
  );
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section>
      <Button
        href={href}
        style={{
          display: "inline-block",
          padding: "12px 20px",
          backgroundColor: ink,
          color: paper,
          fontWeight: "bold",
          textDecoration: "none",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}
