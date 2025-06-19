import { useTheme } from "@mui/material";

type StyledHyperLinkPropsType = {
  text: string;
  link: string;
};
const StyledHyperLink = ({ text, link }: StyledHyperLinkPropsType) => {
  const theme = useTheme();

  return (
    <>
      {" "}
      <a
        href={link}
        target="_blank"
        style={{
          color: theme.palette.primary.main,
          textDecoration: "underline",
        }}
      >
        {text}
      </a>{" "}
    </>
  );
};

export default StyledHyperLink;
