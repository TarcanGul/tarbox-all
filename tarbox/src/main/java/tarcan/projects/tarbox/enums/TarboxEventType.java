package tarcan.projects.tarbox.enums;

public enum TarboxEventType {
    DOWNLOAD_WINDOWS,
    DOWNLOAD_LINUX,
    DOWNLOAD_MAC
    ;

    String type;

    TarboxEventType() {
        this.type = name().toLowerCase();
    }

    public String getTypeString() {
        return this.type;
    }

}
