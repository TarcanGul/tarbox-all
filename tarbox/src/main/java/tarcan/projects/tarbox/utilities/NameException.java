package tarcan.projects.tarbox.utilities;

public class NameException extends Exception {

    private static final String MESSAGE = "Please use only alphanumeric characters.";
    
    public NameException() {
        super(MESSAGE);
    }
}
