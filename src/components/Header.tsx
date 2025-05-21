import { Card, Typography, styled } from "@mui/material";

const HeaderCard = styled(Card, { shouldForwardProp: (props) => props !== 'type'})<{ type: 'setup' | 'sumo' | 'uq' }>(({ type }) => `
  background-color: ${type === 'setup' ? '#202427' : ''};
  background-color: ${type === 'sumo' ? '#202427' : ''};
  background-color: ${type === 'uq' ? '#202427' : ''};
  border: none;
  border-radius: 0px;
  text-align: center;
  color: white;
  padding: 16px;
`);

function Header(props: HeaderProps) {
  const { headerType, tabTitle } = props;
    return (
        <HeaderCard type={headerType} variant="outlined">
            <Typography variant="h5" component="div">
                {tabTitle}
            </Typography>
        </HeaderCard>
    );
};

export default Header;