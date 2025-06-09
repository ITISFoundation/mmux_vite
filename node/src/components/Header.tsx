import { InfoOutline } from "@mui/icons-material";
import { Typography, styled } from "@mui/material";
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

const HeaderContainer = styled('div')`
  text-align: left;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  width: 100%;
`;

const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.default,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.default,
    fontFamily: 'inherit',
    fontWeight: 200,
    fontSize: '0.9rem',
    padding: '8px 12px',
  },
}));

function Header(props: HeaderProps) {
  const { tabTitle, infoText } = props;
    return (
        <HeaderContainer>
            <Typography variant="h5" component="h1" fontWeight={200} fontFamily={'inherit'}>
                {tabTitle}
            </Typography>
            {infoText && infoText.length > 0 &&
            <BootstrapTooltip title={infoText} placement="right" arrow>
                  <InfoOutline sx={(theme) => ({
              color: theme.palette.text.secondary,
              backgroundColor: theme.palette.grey[100],
              borderRadius: '50%',
              padding: '2px',
              marginLeft: '8px',
            })}/>
            </BootstrapTooltip>}
        </HeaderContainer>
    );
};

export default Header;