import { useTheme } from "@mui/material";

type StyledHyperLinkPropsType = {
  text: string;
  link: string | undefined;
};
function StyledHyperLink({ text, link }: StyledHyperLinkPropsType) {
  const theme = useTheme();

  return (
    <>
      {" "}
      <a
        href={link !== undefined ? link : "#"}
        target="_blank"
        style={{
          color: theme.palette.primary.main,
          textDecoration: "underline",
        }}
        rel="noreferrer"
      >
        {text}
      </a>{" "}
    </>
  );
}

export default StyledHyperLink;
